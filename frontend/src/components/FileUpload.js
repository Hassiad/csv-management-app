import React, { useState, useRef } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

const FileUpload = ({ onFilesUpload, loading }) => {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelection(droppedFiles);
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFileSelection(selectedFiles);
  };

  const handleFileSelection = (selectedFiles) => {
    const newErrors = [];
    const newFiles = {};

    selectedFiles.forEach((file) => {
      // Validate file type
      if (!file.name.toLowerCase().endsWith(".csv")) {
        newErrors.push(`${file.name} is not a CSV file`);
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        newErrors.push(`${file.name} is too large (max 10MB)`);
        return;
      }

      // Determine file type based on content or name
      const fileName = file.name.toLowerCase();
      if (fileName.includes("string") || fileName.includes("strings")) {
        newFiles.strings = file;
      } else if (
        fileName.includes("classification") ||
        fileName.includes("classifications")
      ) {
        newFiles.classifications = file;
      } else {
        // If can't determine from filename, let user specify
        newErrors.push(
          `Cannot determine type for ${file.name}. Please rename to include 'strings' or 'classifications'`
        );
      }
    });

    setErrors(newErrors);
    setFiles((prevFiles) => ({ ...prevFiles, ...newFiles }));
  };

  const handleUpload = async () => {
    if (Object.keys(files).length < 2) {
      setErrors(["Please upload both strings and classifications CSV files"]);
      return;
    }

    try {
      await onFilesUpload(files);
      setFiles({});
      setErrors([]);
    } catch (error) {
      setErrors([error.message || "Upload failed"]);
    }
  };

  const removeFile = (fileType) => {
    setFiles((prevFiles) => {
      const newFiles = { ...prevFiles };
      delete newFiles[fileType];
      return newFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="file-upload">
      <h2>Upload CSV Files</h2>
      <p>
        Upload your strings.csv and classifications.csv files to get started
      </p>

      <div
        className={`upload-area ${dragOver ? "dragover" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="upload-icon" />
        <div className="upload-text">
          <strong>Click to upload</strong> or drag and drop your CSV files here
        </div>
        <div className="upload-subtext">
          Supports: .csv files up to 10MB each
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="file-input"
        accept=".csv"
        multiple
        onChange={handleFileInputChange}
      />

      {Object.keys(files).length > 0 && (
        <div className="file-info">
          <h3>Selected Files:</h3>
          {Object.entries(files).map(([fileType, file]) => (
            <div key={fileType} className="file-item">
              <div className="file-details">
                <FileText size={20} />
                <div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    {fileType} • {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <button
                className="remove-file-btn"
                onClick={() => removeFile(fileType)}
                disabled={loading}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="upload-errors">
          <AlertCircle size={20} />
          <div>
            {errors.map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="upload-actions">
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={loading || Object.keys(files).length < 2}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Uploading...
            </>
          ) : (
            "Upload Files"
          )}
        </button>
      </div>

      <div className="upload-help">
        <h4>Expected File Formats:</h4>
        <div className="format-info">
          <div>
            <strong>strings.csv:</strong> Tier, Industry, Topic, Subtopic,
            Prefix, Fuzzing-Idx, Prompt, Risks, Keywords
          </div>
          <div>
            <strong>classifications.csv:</strong> Topic, SubTopic, Industry,
            Classification
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
