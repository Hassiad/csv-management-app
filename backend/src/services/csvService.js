const fs = require("fs").promises;
const path = require("path");
const CsvParser = require("../utils/csvParser");
const { v4: uuidv4 } = require("uuid");

class CsvService {
  constructor() {
    this.sessions = new Map(); // In-memory storage for demo
    this.uploadsDir = path.join(__dirname, "../../uploads");

    // Start cleanup process
    this.startSessionCleanup();
  }

  async uploadCSV(file, fileType, providedSessionId = null) {
    try {
      console.log(`Uploading ${fileType} file: ${file.originalname}`);

      // Use provided session ID or create new one
      const sessionId = providedSessionId || uuidv4();

      const parsedData = await CsvParser.parseCSV(file.path);
      console.log(`Parsed ${parsedData.data.length} rows for ${fileType}`);

      // Validate headers based on file type
      const expectedHeaders = this.getExpectedHeaders(fileType);
      const validation = CsvParser.validateHeaders(
        parsedData.headers,
        expectedHeaders
      );

      if (!validation.isValid) {
        // Clean up uploaded file
        await this.cleanupFile(file.path);
        throw new Error(
          `Invalid headers for ${fileType}. Missing: ${validation.missingHeaders.join(
            ", "
          )}`
        );
      }

      // Sanitize data
      const sanitizedData = CsvParser.sanitizeData(parsedData.data);

      // Initialize or get existing session data
      if (!this.sessions.has(sessionId)) {
        console.log(`Created new session: ${sessionId}`);
        this.sessions.set(sessionId, {});
      }

      const sessionData = this.sessions.get(sessionId);
      sessionData[fileType] = {
        headers: parsedData.headers,
        data: sanitizedData,
        originalFileName: file.originalname,
        uploadTime: new Date().toISOString(),
      };

      console.log(`Stored ${fileType} data in session ${sessionId}`);
      console.log(
        `Session now contains: [${Object.keys(sessionData).join(", ")}]`
      );

      // Clean up uploaded file after processing
      await this.cleanupFile(file.path);

      return {
        sessionId,
        fileType,
        headers: parsedData.headers,
        data: sanitizedData,
        rowCount: sanitizedData.length,
      };
    } catch (error) {
      // Clean up on error
      if (file && file.path) {
        await this.cleanupFile(file.path);
      }
      throw error;
    }
  }

  async updateCSVData(sessionId, fileType, data) {
    try {
      console.log(`Updating ${fileType} data for session ${sessionId}`);

      if (!this.sessions.has(sessionId)) {
        console.log("Available sessions:", Array.from(this.sessions.keys()));
        throw new Error("Session not found");
      }

      const sessionData = this.sessions.get(sessionId);
      console.log(
        `Session data contains: [${Object.keys(sessionData).join(", ")}]`
      );

      if (!sessionData[fileType]) {
        throw new Error(`${fileType} data not found in session`);
      }

      // Sanitize updated data
      const sanitizedData = CsvParser.sanitizeData(data);

      // Update session data
      sessionData[fileType].data = sanitizedData;
      sessionData[fileType].lastModified = new Date().toISOString();

      console.log(
        `Successfully updated ${fileType}: ${sanitizedData.length} rows`
      );

      return {
        success: true,
        rowCount: sanitizedData.length,
        lastModified: sessionData[fileType].lastModified,
      };
    } catch (error) {
      console.error(`Update error for ${fileType}:`, error);
      throw error;
    }
  }

  async getCSVData(sessionId, fileType) {
    try {
      console.log(`Getting ${fileType} data for session ${sessionId}`);
      console.log("Available sessions:", Array.from(this.sessions.keys()));

      if (!this.sessions.has(sessionId)) {
        throw new Error("Session not found");
      }

      const sessionData = this.sessions.get(sessionId);
      console.log(`Session contains: [${Object.keys(sessionData).join(", ")}]`);

      if (!sessionData[fileType]) {
        throw new Error(`${fileType} data not found in session`);
      }

      return sessionData[fileType];
    } catch (error) {
      console.error(`Get data error for ${fileType}:`, error);
      throw error;
    }
  }

  async exportCSV(sessionId, fileType) {
    try {
      console.log(`Exporting ${fileType} for session ${sessionId}`);

      const csvData = await this.getCSVData(sessionId, fileType);

      // Generate unique filename for export
      const exportFileName = `${fileType}_${Date.now()}.csv`;
      const exportPath = path.join(this.uploadsDir, exportFileName);

      await CsvParser.writeCSV(csvData.data, csvData.headers, exportPath);

      console.log(`Export completed: ${exportFileName}`);

      return {
        filePath: exportPath,
        fileName: exportFileName,
        downloadUrl: `/uploads/${exportFileName}`,
      };
    } catch (error) {
      console.error("Export error:", error);
      throw error;
    }
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    } catch (error) {
      console.warn(`Failed to cleanup file ${filePath}:`, error.message);
    }
  }

  async cleanupSession(sessionId) {
    try {
      if (this.sessions.has(sessionId)) {
        this.sessions.delete(sessionId);
        console.log(`Cleaned up session: ${sessionId}`);
        return true;
      }
      console.log(`Session ${sessionId} not found for cleanup`);
      return false;
    } catch (error) {
      console.error(`Error cleaning up session ${sessionId}:`, error);
      return false;
    }
  }

  getExpectedHeaders(fileType) {
    const headerMaps = {
      strings: [
        "Tier",
        "Industry",
        "Topic",
        "Subtopic",
        "Prefix",
        "Fuzzing-Idx",
        "Prompt",
        "Risks",
        "Keywords",
      ],
      classifications: ["Topic", "SubTopic", "Industry", "Classification"],
    };

    return headerMaps[fileType] || [];
  }

  // Get session info for debugging
  getSessionInfo(sessionId) {
    if (!this.sessions.has(sessionId)) {
      return null;
    }

    const sessionData = this.sessions.get(sessionId);
    const info = {};

    Object.keys(sessionData).forEach((fileType) => {
      info[fileType] = {
        rowCount: sessionData[fileType].data?.length || 0,
        uploadTime: sessionData[fileType].uploadTime,
        lastModified: sessionData[fileType].lastModified,
        headers: sessionData[fileType].headers,
      };
    });

    return info;
  }

  // Get all sessions (for debugging)
  getAllSessions() {
    const sessions = {};
    this.sessions.forEach((data, sessionId) => {
      sessions[sessionId] = this.getSessionInfo(sessionId);
    });
    return sessions;
  }

  // Cleanup old sessions periodically
  startSessionCleanup() {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      let cleanedCount = 0;

      for (const [sessionId, sessionData] of this.sessions) {
        const shouldCleanup = Object.values(sessionData).some((fileData) => {
          if (!fileData.uploadTime) return true;
          const uploadTime = new Date(fileData.uploadTime);
          const hoursDiff = (now - uploadTime) / (1000 * 60 * 60);
          return hoursDiff > 24; // Clean up sessions older than 24 hours
        });

        if (shouldCleanup) {
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} old sessions`);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Store reference for cleanup on shutdown
    this.cleanupInterval = cleanupInterval;
  }

  // Graceful shutdown
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    console.log("CSV Service shutdown completed");
  }
}

module.exports = new CsvService();
