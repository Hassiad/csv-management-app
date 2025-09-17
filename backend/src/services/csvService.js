const fs = require("fs").promises;
const path = require("path");
const CsvParser = require("../utils/csvParser");
const { v4: uuidv4 } = require("uuid");

class CsvService {
  constructor() {
    this.sessions = new Map(); // In-memory storage for demo
    this.uploadsDir = path.join(__dirname, "../../uploads");

    // Ensure uploads directory exists
    this.ensureUploadsDir();
  }

  async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.warn("Failed to create uploads directory:", error.message);
    }
  }

  async uploadCSV(file, fileType) {
    try {
      console.log(`Uploading ${fileType} file:`, file.originalname);

      const sessionId = uuidv4();
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

      // Initialize session if it doesn't exist
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, {});
        console.log(`Created new session: ${sessionId}`);
      }

      // Store session data
      const sessionData = this.sessions.get(sessionId);
      sessionData[fileType] = {
        headers: parsedData.headers,
        data: sanitizedData,
        originalFileName: file.originalname,
        uploadTime: new Date().toISOString(),
      };

      console.log(`Stored ${fileType} data in session ${sessionId}`);
      console.log(`Session now contains:`, Object.keys(sessionData));

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
      console.error(`Upload error for ${fileType}:`, error);
      // Clean up on error
      if (file && file.path) {
        await this.cleanupFile(file.path);
      }
      throw error;
    }
  }

  async uploadMultipleCSVs(files) {
    try {
      const sessionId = uuidv4();
      console.log(`Creating multi-file session: ${sessionId}`);

      // Initialize session
      this.sessions.set(sessionId, {});
      const sessionData = this.sessions.get(sessionId);

      const results = {};

      for (const [fileType, file] of Object.entries(files)) {
        console.log(`Processing ${fileType} file:`, file.originalname);

        const parsedData = await CsvParser.parseCSV(file.path);
        console.log(`Parsed ${parsedData.data.length} rows for ${fileType}`);

        // Validate headers based on file type
        const expectedHeaders = this.getExpectedHeaders(fileType);
        const validation = CsvParser.validateHeaders(
          parsedData.headers,
          expectedHeaders
        );

        if (!validation.isValid) {
          // Clean up all uploaded files
          await Promise.all(
            Object.values(files).map((f) => this.cleanupFile(f.path))
          );
          throw new Error(
            `Invalid headers for ${fileType}. Missing: ${validation.missingHeaders.join(
              ", "
            )}`
          );
        }

        // Sanitize data
        const sanitizedData = CsvParser.sanitizeData(parsedData.data);

        // Store in session
        sessionData[fileType] = {
          headers: parsedData.headers,
          data: sanitizedData,
          originalFileName: file.originalname,
          uploadTime: new Date().toISOString(),
        };

        results[fileType] = {
          headers: parsedData.headers,
          data: sanitizedData,
          rowCount: sanitizedData.length,
        };

        // Clean up uploaded file
        await this.cleanupFile(file.path);
      }

      console.log(
        `Multi-file session ${sessionId} created with:`,
        Object.keys(sessionData)
      );

      return {
        sessionId,
        files: results,
      };
    } catch (error) {
      console.error("Multi-file upload error:", error);
      // Clean up all files on error
      if (files) {
        await Promise.all(
          Object.values(files).map((file) =>
            file && file.path ? this.cleanupFile(file.path) : Promise.resolve()
          )
        );
      }
      throw error;
    }
  }

  async updateCSVData(sessionId, fileType, data) {
    try {
      console.log(`Updating ${fileType} data for session ${sessionId}`);

      if (!this.sessions.has(sessionId)) {
        console.log(`Available sessions:`, Array.from(this.sessions.keys()));
        throw new Error("Session not found");
      }

      const sessionData = this.sessions.get(sessionId);
      console.log(`Session data contains:`, Object.keys(sessionData));

      if (!sessionData[fileType]) {
        throw new Error(`${fileType} data not found in session`);
      }

      // Sanitize updated data
      const sanitizedData = CsvParser.sanitizeData(data);

      // Update session data
      sessionData[fileType].data = sanitizedData;
      sessionData[fileType].lastModified = new Date().toISOString();

      console.log(`Updated ${fileType} data: ${sanitizedData.length} rows`);

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

      if (!this.sessions.has(sessionId)) {
        console.log(`Available sessions:`, Array.from(this.sessions.keys()));
        throw new Error("Session not found");
      }

      const sessionData = this.sessions.get(sessionId);
      console.log(`Session data contains:`, Object.keys(sessionData));

      if (!sessionData[fileType]) {
        throw new Error(`${fileType} data not found in session`);
      }

      return sessionData[fileType];
    } catch (error) {
      console.error(`Get data error for ${fileType}:`, error);
      throw error;
    }
  }

  async getAllSessionData(sessionId) {
    try {
      console.log(`Getting all data for session ${sessionId}`);

      if (!this.sessions.has(sessionId)) {
        console.log(`Available sessions:`, Array.from(this.sessions.keys()));
        throw new Error("Session not found");
      }

      const sessionData = this.sessions.get(sessionId);
      console.log(`Session contains:`, Object.keys(sessionData));

      return sessionData;
    } catch (error) {
      console.error("Get all session data error:", error);
      throw error;
    }
  }

  async exportCSV(sessionId, fileType) {
    try {
      console.log(`Exporting ${fileType} for session ${sessionId}`);

      const csvData = await this.getCSVData(sessionId, fileType);

      // Generate unique filename for export
      const timestamp = Date.now();
      const exportFileName = `${fileType}_${timestamp}.csv`;
      const exportPath = path.join(this.uploadsDir, exportFileName);

      await CsvParser.writeCSV(csvData.data, csvData.headers, exportPath);

      console.log(`Exported ${fileType} to:`, exportPath);

      return {
        filePath: exportPath,
        fileName: exportFileName,
        downloadUrl: `/uploads/${exportFileName}`,
      };
    } catch (error) {
      console.error(`Export error for ${fileType}:`, error);
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
      return false;
    } catch (error) {
      console.error(`Session cleanup error:`, error);
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

  // Get session stats for debugging
  getSessionStats() {
    const stats = {
      totalSessions: this.sessions.size,
      sessions: {},
    };

    for (const [sessionId, sessionData] of this.sessions) {
      stats.sessions[sessionId] = {
        fileTypes: Object.keys(sessionData),
        counts: {},
      };

      for (const [fileType, data] of Object.entries(sessionData)) {
        stats.sessions[sessionId].counts[fileType] = data.data?.length || 0;
      }
    }

    return stats;
  }

  // Cleanup old sessions periodically
  startSessionCleanup() {
    const cleanupInterval = setInterval(() => {
      try {
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
      } catch (error) {
        console.error("Session cleanup error:", error);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Return cleanup function
    return () => clearInterval(cleanupInterval);
  }
}

module.exports = new CsvService();
