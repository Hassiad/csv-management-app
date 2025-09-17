import React, { useState, useEffect, useMemo } from "react";
import { Trash2, Plus, Save, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

const EditableTable = ({
  data,
  headers,
  fileType,
  onDataUpdate,
  validationErrors = [],
  loading,
}) => {
  const [tableData, setTableData] = useState(data || []);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTableData(data || []);
    setHasChanges(false);
  }, [data]);

  // Create error lookup for quick access
  const errorLookup = useMemo(() => {
    const lookup = {};
    validationErrors.forEach((error) => {
      if (error.row) {
        lookup[error.row - 1] = error; // Convert to 0-based index
      }
    });
    return lookup;
  }, [validationErrors]);

  const handleCellChange = (rowIndex, header, value) => {
    const newData = [...tableData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [header]: value,
    };
    setTableData(newData);
    setHasChanges(true);
  };

  const handleAddRow = () => {
    const newRow = {};
    headers.forEach((header) => {
      newRow[header] = "";
    });

    setTableData([...tableData, newRow]);
    setHasChanges(true);
    toast.success("Row added");
  };

  const handleDeleteRow = (rowIndex) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const newData = tableData.filter((_, index) => index !== rowIndex);
      setTableData(newData);
      setHasChanges(true);
      toast.success("Row deleted");
    }
  };

  const handleSave = async () => {
    try {
      await onDataUpdate(tableData);
      setHasChanges(false);
      toast.success("Changes saved successfully");
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };

  const getCellClassName = (rowIndex, header) => {
    let className = "cell-input";

    const error = errorLookup[rowIndex];
    if (
      error &&
      (error.type === "invalid_combination" ||
        error.type === "missing_required_field")
    ) {
      className += " error";
    }

    return className;
  };

  const getRowClassName = (rowIndex) => {
    let className = "";

    if (errorLookup[rowIndex]) {
      className += " error-row";
    }

    return className;
  };

  if (!tableData || tableData.length === 0) {
    return (
      <div className="empty-table">
        <p>No data available</p>
        <button className="btn btn-primary" onClick={handleAddRow}>
          Add First Row
        </button>
      </div>
    );
  }

  return (
    <div className="editable-table">
      <div className="table-header">
        <div className="table-title">
          <h3>
            {fileType === "strings" ? "Strings Data" : "Classifications Data"}
          </h3>
          <span className="row-count">{tableData.length} rows</span>
        </div>

        {hasChanges && (
          <div className="unsaved-changes">
            <AlertTriangle size={16} />
            <span>Unsaved changes</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={loading}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th className="row-number-header">#</th>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className={getRowClassName(rowIndex)}>
                <td className="row-number">
                  {rowIndex + 1}
                  {errorLookup[rowIndex] && (
                    <div
                      className="error-indicator"
                      title={errorLookup[rowIndex].message}
                    >
                      <AlertTriangle size={14} />
                    </div>
                  )}
                </td>
                {headers.map((header) => (
                  <td key={header}>
                    <input
                      type="text"
                      className={getCellClassName(rowIndex, header)}
                      value={row[header] || ""}
                      onChange={(e) =>
                        handleCellChange(rowIndex, header, e.target.value)
                      }
                      disabled={loading}
                      placeholder={`Enter ${header}`}
                    />
                  </td>
                ))}
                <td className="actions-cell">
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteRow(rowIndex)}
                    disabled={loading}
                    title="Delete row"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <button
          className="add-row-btn"
          onClick={handleAddRow}
          disabled={loading}
        >
          <Plus size={16} />
          Add Row
        </button>

        <div className="table-stats">
          Total rows: {tableData.length}
          {validationErrors.length > 0 && (
            <span className="error-count">
              • {validationErrors.length} validation errors
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditableTable;
