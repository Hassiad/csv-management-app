import axios from "axios";

// Determine API URL based on environment
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    // In production, API is served from the same domain
    return "/api";
  }

  // Development - use explicit backend URL
  return process.env.REACT_APP_API_URL || "http://localhost:5000/api";
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout for Railway
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add Railway-specific headers if needed
    if (process.env.NODE_ENV === "production") {
      config.headers["X-Requested-With"] = "XMLHttpRequest";
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with Railway error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let message = "An error occurred";

    if (error.code === "ECONNREFUSED") {
      message = "Unable to connect to server. Please try again.";
    } else if (error.code === "ETIMEDOUT") {
      message = "Request timed out. Please try again.";
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", {
        message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });
    }

    return Promise.reject(new Error(message));
  }
);

// Rest of the apiService remains the same...
const apiService = {
  uploadFiles: async (formData) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2 minutes for file uploads
    };
    return await apiClient.post("/csv/upload", formData, config);
  },

  updateData: async (sessionId, fileType, data) => {
    return await apiClient.put("/csv/update", {
      sessionId,
      fileType,
      data,
    });
  },

  validateData: async (sessionId) => {
    return await apiClient.post("/csv/validate", {
      sessionId,
    });
  },

  exportFile: async (sessionId, fileType) => {
    return await apiClient.get(`/csv/export/${sessionId}/${fileType}`);
  },

  getData: async (sessionId, fileType) => {
    return await apiClient.get(`/csv/data/${sessionId}/${fileType}`);
  },

  deleteSession: async (sessionId) => {
    return await apiClient.delete(`/csv/session/${sessionId}`);
  },

  healthCheck: async () => {
    return await apiClient.get("/health");
  },
};

export default apiService;
