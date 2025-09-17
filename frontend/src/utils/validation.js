export const validateFileType = (file) => {
  const allowedTypes = ["text/csv", "application/vnd.ms-excel"];
  const allowedExtensions = [".csv"];

  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  return (
    allowedTypes.includes(file.type) ||
    allowedExtensions.includes(fileExtension)
  );
};

export const validateFileSize = (file, maxSizeInMB = 10) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const determineFileType = (filename) => {
  const name = filename.toLowerCase();

  if (name.includes("string")) {
    return "strings";
  } else if (name.includes("classification")) {
    return "classifications";
  }

  return null;
};

export const validateRequiredFields = (data, fileType) => {
  const requiredFields = {
    strings: ["Tier", "Industry", "Topic", "Subtopic"],
    classifications: ["Topic", "SubTopic", "Industry", "Classification"],
  };

  const required = requiredFields[fileType] || [];
  const errors = [];

  data.forEach((row, index) => {
    required.forEach((field) => {
      if (!row[field] || String(row[field]).trim() === "") {
        errors.push({
          row: index + 1,
          field,
          message: `${field} is required`,
        });
      }
    });
  });

  return errors;
};

export const formatValidationErrors = (errors) => {
  return errors.map((error) => ({
    ...error,
    severity:
      error.type === "missing_required_field"
        ? "error"
        : error.type === "invalid_combination"
        ? "error"
        : "warning",
  }));
};
