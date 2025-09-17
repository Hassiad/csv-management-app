const csvService = require("../services/csvService");
const ValidationService = require("../services/validationService");

class CsvController {
  async uploadFiles(req, res) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          error:
            "No files uploaded. Please upload both strings and classifications CSV files.",
        });
      }

      const results = {};
      let sessionId = null;

      // Process each uploaded file
      for (const [fieldName, files] of Object.entries(req.files)) {
        const file = Array.isArray(files) ? files[0] : files;

        try {
          const result = await csvService.uploadCSV(file, fieldName);

          if (!sessionId) {
            sessionId = result.sessionId;
          }

          results[fieldName] = {
            headers: result.headers,
            data: result.data,
            rowCount: result.rowCount,
          };
        } catch (error) {
          return res.status(400).json({
            error: `Error processing ${fieldName} file: ${error.message}`,
          });
        }
      }

      res.json({
        success: true,
        sessionId,
        files: results,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        error: "Internal server error during file upload",
      });
    }
  }

  async updateData(req, res) {
    try {
      const { sessionId, fileType, data } = req.body;

      if (!sessionId || !fileType || !data) {
        return res.status(400).json({
          error: "Missing required fields: sessionId, fileType, or data",
        });
      }

      const result = await csvService.updateCSVData(sessionId, fileType, data);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(400).json({
        error: error.message,
      });
    }
  }

  async validateData(req, res) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          error: "Session ID is required",
        });
      }

      // Get both files data
      const stringsData = await csvService.getCSVData(sessionId, "strings");
      const classificationsData = await csvService.getCSVData(
        sessionId,
        "classifications"
      );

      if (!stringsData || !classificationsData) {
        return res.status(400).json({
          error:
            "Both strings and classifications files are required for validation",
        });
      }

      // Perform validation
      const validation = ValidationService.validateDataIntegrity(
        stringsData.data,
        classificationsData.data
      );

      // Get suggestions for invalid combinations if any
      let suggestions = [];
      if (!validation.isValid) {
        const invalidCombinations = validation.errors
          .filter((error) => error.type === "invalid_combination")
          .map((error) => ({ combination: error.combination, row: error.row }));

        if (invalidCombinations.length > 0) {
          const validCombinations = new Set();
          classificationsData.data.forEach((row) => {
            const { Topic, SubTopic, Industry } = row;
            if (Topic && SubTopic && Industry) {
              validCombinations.add(
                `${Topic.trim()}|${SubTopic.trim()}|${Industry.trim()}`
              );
            }
          });

          suggestions = ValidationService.suggestCorrections(
            invalidCombinations,
            validCombinations
          );
        }
      }

      res.json({
        ...validation,
        suggestions,
      });
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({
        error: "Internal server error during validation",
      });
    }
  }

  async exportFiles(req, res) {
    try {
      const { sessionId, fileType } = req.params;

      if (!sessionId || !fileType) {
        return res.status(400).json({
          error: "Session ID and file type are required",
        });
      }

      const result = await csvService.exportCSV(sessionId, fileType);

      res.json({
        success: true,
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
      });
    } catch (error) {
      console.error("Export error:", error);
      res.status(400).json({
        error: error.message,
      });
    }
  }

  async getData(req, res) {
    try {
      const { sessionId, fileType } = req.params;

      if (!sessionId || !fileType) {
        return res.status(400).json({
          error: "Session ID and file type are required",
        });
      }

      const data = await csvService.getCSVData(sessionId, fileType);

      res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      console.error("Get data error:", error);
      res.status(400).json({
        error: error.message,
      });
    }
  }

  async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error: "Session ID is required",
        });
      }

      const success = await csvService.cleanupSession(sessionId);

      res.json({
        success,
        message: success ? "Session deleted successfully" : "Session not found",
      });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}

module.exports = new CsvController();
