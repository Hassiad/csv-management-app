const csvService = require("../services/csvService");
const ValidationService = require("../services/validationService");

const uploadFiles = async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("Files received:", Object.keys(req.files || {}));

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        error: "No files uploaded",
      });
    }

    // Create a single session for all files
    const sessionId = require("uuid").v4();
    console.log(`Created unified session: ${sessionId}`);

    const uploadResults = {};
    const errors = [];

    // Process each file type and add to the same session
    for (const [fileType, fileArray] of Object.entries(req.files)) {
      try {
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
        console.log(`Processing ${fileType} file: ${file.originalname}`);

        const result = await csvService.uploadCSV(file, fileType, sessionId);
        uploadResults[fileType] = {
          headers: result.headers,
          data: result.data,
          rowCount: result.rowCount,
          originalFileName: file.originalname,
        };

        console.log(
          `Successfully processed ${fileType}: ${result.rowCount} rows`
        );
      } catch (error) {
        console.error(`Error processing ${fileType}:`, error.message);
        errors.push(`${fileType}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      // Clean up session if there were errors
      await csvService.cleanupSession(sessionId);
      return res.status(400).json({
        error: "File upload failed",
        details: errors,
      });
    }

    console.log(`Upload completed for session ${sessionId}`);
    console.log(`Session contains: ${Object.keys(uploadResults)}`);

    res.status(200).json({
      message: "Files uploaded successfully",
      sessionId,
      files: uploadResults,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error.message || "Internal server error during upload",
    });
  }
};

const updateData = async (req, res) => {
  try {
    const { sessionId, fileType, data } = req.body;

    console.log(`Updating ${fileType} data for session ${sessionId}`);

    if (!sessionId || !fileType || !data) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, fileType, data",
      });
    }

    // Validate data before updating
    const validation = ValidationService.validateRowData(
      data[0] || {},
      fileType
    );
    if (!validation.isValid && validation.errors.length > 0) {
      return res.status(400).json({
        error: "Invalid data format",
        validationErrors: validation.errors,
      });
    }

    const result = await csvService.updateCSVData(sessionId, fileType, data);

    console.log(`Successfully updated ${fileType} data: ${data.length} rows`);

    res.status(200).json({
      message: "Data updated successfully",
      ...result,
    });
  } catch (error) {
    console.error(`Update error for ${req.body?.fileType}:`, error);
    res.status(500).json({
      error: error.message || "Internal server error during update",
    });
  }
};

const validateData = async (req, res) => {
  try {
    const { sessionId } = req.body;

    console.log(`Validating data for session ${sessionId}`);

    if (!sessionId) {
      return res.status(400).json({
        error: "Session ID is required",
      });
    }

    // Get both datasets
    const stringsData = await csvService.getCSVData(sessionId, "strings");
    const classificationsData = await csvService.getCSVData(
      sessionId,
      "classifications"
    );

    console.log(
      `Validation data - Strings: ${stringsData.data.length}, Classifications: ${classificationsData.data.length}`
    );

    // Validate data integrity
    const validationResult = ValidationService.validateDataIntegrity(
      stringsData.data,
      classificationsData.data
    );

    // Add suggestions for invalid combinations if any
    if (!validationResult.isValid) {
      const invalidCombinations = validationResult.errors.filter(
        (error) => error.type === "invalid_combination"
      );

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

        validationResult.suggestions = ValidationService.suggestCorrections(
          invalidCombinations,
          validCombinations
        );
      }
    }

    console.log(
      `Validation completed - Valid: ${validationResult.isValid}, Errors: ${validationResult.errors.length}`
    );

    res.status(200).json(validationResult);
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      error: error.message || "Internal server error during validation",
    });
  }
};

const exportFiles = async (req, res) => {
  try {
    const { sessionId, fileType } = req.params;

    console.log(`Exporting ${fileType} for session ${sessionId}`);

    if (!sessionId || !fileType) {
      return res.status(400).json({
        error: "Session ID and file type are required",
      });
    }

    const result = await csvService.exportCSV(sessionId, fileType);

    console.log(`Export completed: ${result.fileName}`);

    res.status(200).json({
      message: "File exported successfully",
      ...result,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      error: error.message || "Internal server error during export",
    });
  }
};

const getData = async (req, res) => {
  try {
    const { sessionId, fileType } = req.params;

    console.log(`Getting ${fileType} data for session ${sessionId}`);

    if (!sessionId || !fileType) {
      return res.status(400).json({
        error: "Session ID and file type are required",
      });
    }

    const data = await csvService.getCSVData(sessionId, fileType);

    res.status(200).json({
      message: "Data retrieved successfully",
      data: data,
    });
  } catch (error) {
    console.error(`Get data error for ${req.params?.fileType}:`, error);
    res.status(500).json({
      error: error.message || "Internal server error during data retrieval",
    });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`Deleting session ${sessionId}`);

    if (!sessionId) {
      return res.status(400).json({
        error: "Session ID is required",
      });
    }

    const result = await csvService.cleanupSession(sessionId);

    res.status(200).json({
      message: result ? "Session deleted successfully" : "Session not found",
      deleted: result,
    });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({
      error: error.message || "Internal server error during session deletion",
    });
  }
};

module.exports = {
  uploadFiles,
  updateData,
  validateData,
  exportFiles,
  getData,
  deleteSession,
};
