class ValidationService {
  static validateDataIntegrity(stringsData, classificationsData) {
    const errors = [];
    const warnings = [];

    if (!stringsData || !classificationsData) {
      throw new Error(
        "Both strings and classifications data are required for validation"
      );
    }

    // Create lookup set for valid combinations from classifications
    const validCombinations = new Set();
    classificationsData.forEach((row, index) => {
      const { Topic, SubTopic, Industry } = row;

      if (!Topic || !SubTopic || !Industry) {
        warnings.push({
          type: "incomplete_classification",
          message: `Classification row ${index + 1} has missing values`,
          row: index + 1,
          data: row,
        });
        return;
      }

      const combination = `${Topic.trim()}|${SubTopic.trim()}|${Industry.trim()}`;
      validCombinations.add(combination);
    });

    // Validate strings data against classifications
    const invalidRows = [];
    stringsData.forEach((row, index) => {
      const { Topic, Subtopic, Industry } = row;

      if (!Topic || !Subtopic || !Industry) {
        errors.push({
          type: "missing_required_field",
          message: `Row ${
            index + 1
          }: Missing required fields (Topic, Subtopic, or Industry)`,
          row: index + 1,
          data: row,
        });
        invalidRows.push(index);
        return;
      }

      const combination = `${Topic.trim()}|${Subtopic.trim()}|${Industry.trim()}`;

      if (!validCombinations.has(combination)) {
        errors.push({
          type: "invalid_combination",
          message: `Row ${
            index + 1
          }: Topic "${Topic}" + SubTopic "${Subtopic}" + Industry "${Industry}" combination not found in classifications`,
          row: index + 1,
          data: row,
          combination: { Topic, Subtopic, Industry },
        });
        invalidRows.push(index);
      }
    });

    // Additional field validations
    stringsData.forEach((row, index) => {
      if (invalidRows.includes(index)) return; // Skip already invalid rows

      // Validate Tier field
      if (row.Tier && !["1", "2", "3"].includes(row.Tier.trim())) {
        warnings.push({
          type: "invalid_tier",
          message: `Row ${index + 1}: Tier should be 1, 2, or 3`,
          row: index + 1,
          data: row,
        });
      }

      // Validate Fuzzing-Idx field (should be numeric)
      if (row["Fuzzing-Idx"] && isNaN(row["Fuzzing-Idx"])) {
        warnings.push({
          type: "invalid_fuzzing_idx",
          message: `Row ${index + 1}: Fuzzing-Idx should be numeric`,
          row: index + 1,
          data: row,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalStringsRows: stringsData.length,
        totalClassificationRows: classificationsData.length,
        invalidRows: invalidRows.length,
        validCombinations: validCombinations.size,
      },
    };
  }

  static validateCSVStructure(data, headers, fileType) {
    const errors = [];
    const warnings = [];

    // Check if data is empty
    if (!data || data.length === 0) {
      errors.push({
        type: "empty_file",
        message: "CSV file is empty or contains no valid data rows",
      });
      return { isValid: false, errors, warnings };
    }

    // Validate each row has all required headers
    data.forEach((row, index) => {
      headers.forEach((header) => {
        if (!(header in row)) {
          errors.push({
            type: "missing_column",
            message: `Row ${index + 1}: Missing column "${header}"`,
            row: index + 1,
            column: header,
          });
        }
      });

      // Check for completely empty rows
      const hasData = Object.values(row).some(
        (value) =>
          value !== null && value !== undefined && String(value).trim() !== ""
      );

      if (!hasData) {
        warnings.push({
          type: "empty_row",
          message: `Row ${index + 1}: Contains no data`,
          row: index + 1,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateRowData(rowData, fileType) {
    const errors = [];

    if (fileType === "strings") {
      // Required fields for strings
      const requiredFields = ["Tier", "Industry", "Topic", "Subtopic"];
      requiredFields.forEach((field) => {
        if (!rowData[field] || String(rowData[field]).trim() === "") {
          errors.push(`${field} is required`);
        }
      });
    } else if (fileType === "classifications") {
      // Required fields for classifications
      const requiredFields = [
        "Topic",
        "SubTopic",
        "Industry",
        "Classification",
      ];
      requiredFields.forEach((field) => {
        if (!rowData[field] || String(rowData[field]).trim() === "") {
          errors.push(`${field} is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static suggestCorrections(invalidCombinations, validCombinations) {
    const suggestions = [];

    invalidCombinations.forEach((invalid) => {
      const { Topic, Subtopic, Industry } = invalid.combination;

      // Find closest matches
      const matches = Array.from(validCombinations)
        .map((combo) => {
          const [validTopic, validSubtopic, validIndustry] = combo.split("|");

          let score = 0;
          if (validTopic.toLowerCase() === Topic.toLowerCase()) score += 3;
          else if (
            validTopic.toLowerCase().includes(Topic.toLowerCase()) ||
            Topic.toLowerCase().includes(validTopic.toLowerCase())
          )
            score += 2;

          if (validSubtopic.toLowerCase() === Subtopic.toLowerCase())
            score += 3;
          else if (
            validSubtopic.toLowerCase().includes(Subtopic.toLowerCase()) ||
            Subtopic.toLowerCase().includes(validSubtopic.toLowerCase())
          )
            score += 2;

          if (validIndustry.toLowerCase() === Industry.toLowerCase())
            score += 3;
          else if (
            validIndustry.toLowerCase().includes(Industry.toLowerCase()) ||
            Industry.toLowerCase().includes(validIndustry.toLowerCase())
          )
            score += 2;

          return {
            combination: {
              Topic: validTopic,
              Subtopic: validSubtopic,
              Industry: validIndustry,
            },
            score,
          };
        })
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      suggestions.push({
        invalid: invalid.combination,
        row: invalid.row,
        suggestions: matches,
      });
    });

    return suggestions;
  }
}

module.exports = ValidationService;
