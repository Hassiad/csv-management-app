const CsvParser = require("../src/utils/csvParser");
const fs = require("fs").promises;
const path = require("path");

describe("CsvParser", () => {
  const testCsvPath = path.join(__dirname, "fixtures/test-parse.csv");

  beforeAll(async () => {
    const fixturesDir = path.join(__dirname, "fixtures");
    await fs.mkdir(fixturesDir, { recursive: true });

    const testCsvContent = `Name,Age,City
John Doe,30,New York
Jane Smith,25,Los Angeles
Bob Johnson,35,Chicago`;

    await fs.writeFile(testCsvPath, testCsvContent);
  });

  afterAll(async () => {
    try {
      await fs.unlink(testCsvPath);
      await fs.rmdir(path.join(__dirname, "fixtures"));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("parseCSV", () => {
    test("should parse CSV file correctly", async () => {
      const result = await CsvParser.parseCSV(testCsvPath);

      expect(result.headers).toEqual(["Name", "Age", "City"]);
      expect(result.data).toHaveLength(3);
      expect(result.rowCount).toBe(3);
      expect(result.data[0]).toEqual({
        Name: "John Doe",
        Age: "30",
        City: "New York",
      });
    });
  });

  describe("validateHeaders", () => {
    test("should validate correct headers", () => {
      const headers = ["Name", "Age", "City"];
      const expectedHeaders = ["Name", "Age", "City"];

      const result = CsvParser.validateHeaders(headers, expectedHeaders);

      expect(result.isValid).toBe(true);
      expect(result.missingHeaders).toHaveLength(0);
    });

    test("should detect missing headers", () => {
      const headers = ["Name", "Age"];
      const expectedHeaders = ["Name", "Age", "City"];

      const result = CsvParser.validateHeaders(headers, expectedHeaders);

      expect(result.isValid).toBe(false);
      expect(result.missingHeaders).toContain("City");
    });
  });

  describe("sanitizeData", () => {
    test("should sanitize data correctly", () => {
      const dirtyData = [
        {
          name: "  John Doe  ",
          age: null,
          city: '<script>alert("xss")</script>',
        },
        { name: "Jane<>", age: undefined, city: "LA" },
      ];

      const cleaned = CsvParser.sanitizeData(dirtyData);

      expect(cleaned[0].name).toBe("John Doe");
      expect(cleaned[0].age).toBe("");
      expect(cleaned[0].city).toBe('scriptalert("xss")/script');
      expect(cleaned[1].name).toBe("Jane");
      expect(cleaned[1].age).toBe("");
    });
  });
});
