const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const csvRoutes = require("./routes/csvRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Rate limiting - more lenient for Railway
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// CORS configuration for Railway
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            process.env.RAILWAY_STATIC_URL,
            process.env.FRONTEND_URL,
            /\.railway\.app$/,
            /localhost:\d+$/,
          ]
        : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files - serve React build in production
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api/csv", csvRoutes);

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT,
    railway: !!process.env.RAILWAY_ENVIRONMENT,
  });
});

// Serve React app in production
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../../frontend/build");

  // Serve static files
  app.use(express.static(buildPath));

  // Handle React Router - send all non-API requests to index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);

  if (process.env.NODE_ENV === "development") {
    res.status(error.status || 500).json({
      error: {
        message: error.message || "Internal Server Error",
        status: error.status || 500,
        stack: error.stack,
      },
    });
  } else {
    res.status(error.status || 500).json({
      error: {
        message: error.status === 404 ? "Not Found" : "Internal Server Error",
        status: error.status || 500,
      },
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found",
      status: 404,
    },
  });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🚂 Railway: ${process.env.RAILWAY_ENVIRONMENT || "false"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

module.exports = app;
