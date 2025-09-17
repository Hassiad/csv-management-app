import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";

const ValidationErrors = ({ validationResult, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    errors: true,
    warnings: false,
    suggestions: false,
    stats: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!validationResult) return null;

  const {
    isValid,
    errors = [],
    warnings = [],
    suggestions = [],
    stats = {},
  } = validationResult;

  return (
    <div className="validation-container">
      <div
        className={`validation-summary ${
          isValid ? "validation-success" : "validation-error"
        }`}
      >
        <div className="validation-header">
          {isValid ? (
            <>
              <CheckCircle size={24} />
              <div>
                <h3>Validation Successful</h3>
                <p>
                  All data integrity checks passed. You can now export your
                  files.
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle size={24} />
              <div>
                <h3>Validation Failed</h3>
                <p>
                  Found {errors.length} error{errors.length !== 1 ? "s" : ""}
                  {warnings.length > 0 &&
                    ` and ${warnings.length} warning${
                      warnings.length !== 1 ? "s" : ""
                    }`}
                  that need to be addressed.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {!isValid && (
        <div className="validation-details">
          {errors.length > 0 && (
            <div className="validation-section">
              <div
                className="validation-section-header"
                onClick={() => toggleSection("errors")}
              >
                {expandedSections.errors ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <XCircle size={16} className="error-icon" />
                <h4>Errors ({errors.length})</h4>
              </div>

              {expandedSections.errors && (
                <ul className="validation-list">
                  {errors.map((error, index) => (
                    <li key={index} className="error-item">
                      <div className="error-row">Row {error.row}</div>
                      <div className="error-message">{error.message}</div>
                      {error.combination && (
                        <div className="error-details">
                          <strong>Invalid combination:</strong>{" "}
                          {error.combination.Topic} +{" "}
                          {error.combination.Subtopic} +{" "}
                          {error.combination.Industry}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="validation-section">
              <div
                className="validation-section-header"
                onClick={() => toggleSection("warnings")}
              >
                {expandedSections.warnings ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <AlertTriangle size={16} className="warning-icon" />
                <h4>Warnings ({warnings.length})</h4>
              </div>

              {expandedSections.warnings && (
                <ul className="validation-list">
                  {warnings.map((warning, index) => (
                    <li key={index} className="warning-item">
                      <div className="error-row">Row {warning.row}</div>
                      <div className="error-message">{warning.message}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="validation-section">
              <div
                className="validation-section-header"
                onClick={() => toggleSection("suggestions")}
              >
                {expandedSections.suggestions ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <Info size={16} className="info-icon" />
                <h4>Suggestions ({suggestions.length})</h4>
              </div>

              {expandedSections.suggestions && (
                <div className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                      <div className="suggestion-header">
                        <strong>Row {suggestion.row}:</strong>{" "}
                        {suggestion.invalid.Topic} +{" "}
                        {suggestion.invalid.Subtopic} +{" "}
                        {suggestion.invalid.Industry}
                      </div>
                      <div className="suggestion-alternatives">
                        <strong>Possible alternatives:</strong>
                        <ul>
                          {suggestion.suggestions.map((alt, altIndex) => (
                            <li key={altIndex}>
                              {alt.combination.Topic} +{" "}
                              {alt.combination.Subtopic} +{" "}
                              {alt.combination.Industry}
                              <span className="match-score">
                                (Score: {alt.score})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="validation-section">
            <div
              className="validation-section-header"
              onClick={() => toggleSection("stats")}
            >
              {expandedSections.stats ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <Info size={16} className="info-icon" />
              <h4>Statistics</h4>
            </div>

            {expandedSections.stats && (
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">
                    {stats.totalStringsRows || 0}
                  </div>
                  <div className="stat-label">Strings Rows</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {stats.totalClassificationRows || 0}
                  </div>
                  <div className="stat-label">Classification Rows</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.invalidRows || 0}</div>
                  <div className="stat-label">Invalid Rows</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {stats.validCombinations || 0}
                  </div>
                  <div className="stat-label">Valid Combinations</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationErrors;
