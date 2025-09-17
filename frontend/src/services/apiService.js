import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (process.env.NODE_ENV === "development") {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data && config.data instanceof FormData) {
        console.log("FormData files:", Array.from(config.data.keys()));
      } else if (config.data) {
        console.log("Request data:", config.data);
      }
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("API Response:", response.status, response.data);
    }
    return response.data;
  },
  (error) => {
    // Extract error message from various possible locations
    let message = "An error occurred";

    if (error.response?.data) {
      const errorData = error.response.data;
      message = errorData.error || errorData.message || message;

      // Include validation errors if present
      if (errorData.details && Array.isArray(errorData.details)) {
        message = `${message}: ${errorData.details.join(", ")}`;
      }

      if (
        errorData.validationErrors &&
        Array.isArray(errorData.validationErrors)
      ) {
        message = `${message}: ${errorData.validationErrors.join(", ")}`;
      }
    } else if (error.message) {
      message = error.message;
    }

    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", {
        status: error.response?.status,
        message: message,
        data: error.response?.data,
        originalError: error,
      });
    }

    return Promise.reject(new Error(message));
  }
);

const apiService = {
  // Upload CSV files
  uploadFiles: async (formData) => {
    try {
      console.log("Uploading files:", Array.from(formData.keys()));

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // Increase timeout for file uploads
      };

      const response = await apiClient.post("/csv/upload", formData, config);

      if (!response.sessionId) {
        throw new Error("No session ID received from server");
      }

      return response;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },

  // Update CSV data
  updateData: async (sessionId, fileType, data) => {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      console.log(`Updating ${fileType} data for session ${sessionId}`);

      return await apiClient.put("/csv/update", {
        sessionId,
        fileType,
        data,
      });
    } catch (error) {
      console.error("Update data error:", error);
      throw error;
    }
  },

  // Validate data integrity
  validateData: async (sessionId) => {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      console.log(`Validating data for session ${sessionId}`);

      return await apiClient.post("/csv/validate", {
        sessionId,
      });
    } catch (error) {
      console.error("Validation error:", error);
      throw error;
    }
  },

  // Export CSV file
  exportFile: async (sessionId, fileType) => {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      console.log(`Exporting ${fileType} for session ${sessionId}`);

      return await apiClient.get(`/csv/export/${sessionId}/${fileType}`);
    } catch (error) {
      console.error("Export error:", error);
      throw error;
    }
  },

  // Get CSV data
  getData: async (sessionId, fileType) => {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      return await apiClient.get(`/csv/data/${sessionId}/${fileType}`);
    } catch (error) {
      console.error("Get data error:", error);
      throw error;
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      return await apiClient.delete(`/csv/session/${sessionId}`);
    } catch (error) {
      console.error("Delete session error:", error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      return await apiClient.get("/health");
    } catch (error) {
      console.error("Health check error:", error);
      throw error;
    }
  },

  // Debug endpoints
  getSessionInfo: async (sessionId) => {
    try {
      return await apiClient.get(`/csv/debug/session/${sessionId}`);
    } catch (error) {
      console.error("Get session info error:", error);
      throw error;
    }
  },

  getAllSessions: async () => {
    try {
      return await apiClient.get("/csv/debug/sessions");
    } catch (error) {
      console.error("Get all sessions error:", error);
      throw error;
    }
  },
};

export default apiService;
