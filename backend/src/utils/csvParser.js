const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { pipeline } = require("stream/promises");

class CsvParser {
  static async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const headers = [];
      let isFirstRow = true;

      fs.createReadStream(filePath)
        .pipe(
          csv({
            skipEmptyLines: true,
            skipLinesWithError: true,
            trim: true,
          })
        )
        .on("headers", (headerList) => {
          headers.push(...headerList.map((h) => h.trim()));
        })
        .on("data", (data) => {
          if (isFirstRow) {
            isFirstRow = false;
          }

          // Clean and normalize data
          const cleanData = {};
          Object.keys(data).forEach((key) => {
            const cleanKey = key.trim();
            const cleanValue =
              typeof data[key] === "string" ? data[key].trim() : data[key];
            cleanData[cleanKey] = cleanValue;
          });

          results.push(cleanData);
        })
        .on("end", () => {
          resolve({
            headers: headers,
            data: results,
            rowCount: results.length,
          });
        })
        .on("error", (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        });
    });
  }

  static async writeCSV(data, headers, filePath) {
    try {
      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers.map((h) => ({ id: h, title: h })),
        encoding: "utf8",
      });

      await csvWriter.writeRecords(data);
      return filePath;
    } catch (error) {
      throw new Error(`CSV writing error: ${error.message}`);
    }
  }

  static validateHeaders(headers, expectedHeaders) {
    const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
    const extraHeaders = headers.filter((h) => !expectedHeaders.includes(h));

    return {
      isValid: missingHeaders.length === 0,
      missingHeaders,
      extraHeaders,
      headers,
    };
  }

  static sanitizeData(data) {
    return data.map((row) => {
      const sanitizedRow = {};
      Object.keys(row).forEach((key) => {
        let value = row[key];

        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = "";
        }

        // Convert to string and trim
        value = String(value).trim();

        // Remove any potentially harmful content
        value = value.replace(/[<>]/g, "");

        sanitizedRow[key] = value;
      });
      return sanitizedRow;
    });
  }
}

module.exports = CsvParser;
