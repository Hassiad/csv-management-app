import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import apiService from "../services/apiService";

const useCsvData = () => {
  const [sessionId, setSessionId] = useState(null);
  const [filesData, setFilesData] = useState({});
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const uploadFiles = useCallback(async (files) => {
    setLoading(true);
    try {
      const formData = new FormData();

      Object.entries(files).forEach(([fileType, file]) => {
        formData.append(fileType, file);
      });

      const response = await apiService.uploadFiles(formData);

      setSessionId(response.sessionId);
      setFilesData(response.files);
      setValidationResult(null);

      toast.success("Files uploaded successfully!");
    } catch (error) {
      toast.error(error.message || "Upload failed");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateData = useCallback(
    async (fileType, data) => {
      if (!sessionId) {
        toast.error("No active session");
        return;
      }

      setLoading(true);
      try {
        await apiService.updateData(sessionId, fileType, data);

        // Update local state
        setFilesData((prev) => ({
          ...prev,
          [fileType]: {
            ...prev[fileType],
            data: data,
          },
        }));

        // Clear previous validation results
        setValidationResult(null);
      } catch (error) {
        toast.error(error.message || "Update failed");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const validateData = useCallback(async () => {
    if (!sessionId) {
      toast.error("No active session");
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.validateData(sessionId);
      setValidationResult(result);

      if (result.isValid) {
        toast.success("Data validation passed!");
      } else {
        toast.error(`Validation failed with ${result.errors.length} errors`);
      }

      return result;
    } catch (error) {
      toast.error(error.message || "Validation failed");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const exportFile = useCallback(
    async (fileType) => {
      if (!sessionId) {
        toast.error("No active session");
        return;
      }

      setLoading(true);
      try {
        const result = await apiService.exportFile(sessionId, fileType);

        // Create download link
        const link = document.createElement("a");
        link.href = result.downloadUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`${fileType} file exported successfully!`);
      } catch (error) {
        toast.error(error.message || "Export failed");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const resetSession = useCallback(() => {
    setSessionId(null);
    setFilesData({});
    setValidationResult(null);
    setLoading(false);
  }, []);

  const deleteSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await apiService.deleteSession(sessionId);
      resetSession();
      toast.success("Session cleared");
    } catch (error) {
      toast.error("Failed to clear session");
    }
  }, [sessionId, resetSession]);

  return {
    sessionId,
    filesData,
    loading,
    validationResult,
    uploadFiles,
    updateData,
    validateData,
    exportFile,
    resetSession,
    deleteSession,
  };
};

export default useCsvData;
