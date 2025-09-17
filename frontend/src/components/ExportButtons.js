import React from "react";
import { Download } from "lucide-react";
import { toast } from "react-hot-toast";

const ExportButtons = ({ onExport, disabled }) => {
  const handleExport = async (fileType) => {
    try {
      await onExport(fileType);
    } catch (error) {
      toast.error(`Failed to export ${fileType} file`);
    }
  };

  return (
    <div className="export-buttons">
      <button
        className="btn btn-export"
        onClick={() => handleExport("strings")}
        disabled={disabled}
        title="Export strings CSV file"
      >
        <Download size={16} />
        Export Strings
      </button>

      <button
        className="btn btn-export"
        onClick={() => handleExport("classifications")}
        disabled={disabled}
        title="Export classifications CSV file"
      >
        <Download size={16} />
        Export Classifications
      </button>
    </div>
  );
};

export default ExportButtons;
