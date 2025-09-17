import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import FileUpload from "./components/FileUpload";
import EditableTable from "./components/EditableTable";
import ValidationErrors from "./components/ValidationErrors";
import ExportButtons from "./components/ExportButtons";
import useCsvData from "./hooks/useCsvData";
import "./App.css";

function App() {
  const {
    sessionId,
    filesData,
    loading,
    validationResult,
    uploadFiles,
    updateData,
    validateData,
    exportFile,
    resetSession,
  } = useCsvData();

  const [activeTab, setActiveTab] = useState("strings");

  const handleFilesUpload = async (files) => {
    await uploadFiles(files);
  };

  const handleDataUpdate = async (fileType, data) => {
    await updateData(fileType, data);
  };

  const handleValidation = async () => {
    await validateData();
  };

  const handleExport = async (fileType) => {
    await exportFile(fileType);
  };

  const handleReset = () => {
    resetSession();
    setActiveTab("strings");
  };

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />

      <header className="app-header">
        <h1>CSV Data Management System</h1>
        <p>
          Upload, edit, validate, and export CSV files with data integrity
          checks
        </p>
      </header>

      <main className="app-main">
        {!sessionId ? (
          <div className="upload-section">
            <FileUpload onFilesUpload={handleFilesUpload} loading={loading} />
          </div>
        ) : (
          <div className="management-section">
            <div className="control-bar">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === "strings" ? "active" : ""}`}
                  onClick={() => setActiveTab("strings")}
                  disabled={loading}
                >
                  Strings Data ({filesData.strings?.data?.length || 0} rows)
                </button>
                <button
                  className={`tab ${
                    activeTab === "classifications" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("classifications")}
                  disabled={loading}
                >
                  Classifications Data (
                  {filesData.classifications?.data?.length || 0} rows)
                </button>
              </div>

              <div className="actions">
                <button
                  className="btn btn-primary"
                  onClick={handleValidation}
                  disabled={loading}
                >
                  {loading ? "Validating..." : "Validate Data"}
                </button>
                <ExportButtons
                  onExport={handleExport}
                  disabled={
                    loading || (validationResult && !validationResult.isValid)
                  }
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>

            {validationResult && (
              <ValidationErrors
                validationResult={validationResult}
                onClose={() => {
                  /* Reset validation result if needed */
                }}
              />
            )}

            <div className="table-container">
              {filesData[activeTab] && (
                <EditableTable
                  key={activeTab}
                  data={filesData[activeTab].data}
                  headers={filesData[activeTab].headers}
                  fileType={activeTab}
                  onDataUpdate={(data) => handleDataUpdate(activeTab, data)}
                  validationErrors={validationResult?.errors || []}
                  loading={loading}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 CSV Data Management System</p>
      </footer>
    </div>
  );
}

export default App;
