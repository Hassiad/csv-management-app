const express = require("express");
const upload = require("../middleware/upload");
const csvController = require("../controllers/csvController");

const router = express.Router();

// Upload CSV files
router.post(
  "/upload",
  upload.fields([
    { name: "strings", maxCount: 1 },
    { name: "classifications", maxCount: 1 },
  ]),
  csvController.uploadFiles
);

// Update CSV data
router.put("/update", csvController.updateData);

// Validate data integrity
router.post("/validate", csvController.validateData);

// Export CSV files
router.get("/export/:sessionId/:fileType", csvController.exportFiles);

// Get CSV data
router.get("/data/:sessionId/:fileType", csvController.getData);

// Delete session
router.delete("/session/:sessionId", csvController.deleteSession);

module.exports = router;
