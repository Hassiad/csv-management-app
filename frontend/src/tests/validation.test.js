import {
  validateFileType,
  validateFileSize,
  determineFileType,
  validateRequiredFields,
} from "../utils/validation";

describe("Validation Utils", () => {
  describe("validateFileType", () => {
    test("validates CSV files", () => {
      const csvFile = new File([""], "test.csv", { type: "text/csv" });
      expect(validateFileType(csvFile)).toBe(true);
    });

    test("rejects non-CSV files", () => {
      const txtFile = new File([""], "test.txt", { type: "text/plain" });
      expect(validateFileType(txtFile)).toBe(false);
    });

    test("validates by extension when type is not set", () => {
      const csvFile = new File([""], "test.csv", { type: "" });
      expect(validateFileType(csvFile)).toBe(true);
    });
  });

  describe("validateFileSize", () => {
    test("validates file size within limit", () => {
      const smallFile = new File(["a".repeat(1024)], "small.csv");
      expect(validateFileSize(smallFile, 1)).toBe(true);
    });

    test("rejects oversized files", () => {
      const largeFile = new File(["a".repeat(2 * 1024 * 1024)], "large.csv");
      expect(validateFileSize(largeFile, 1)).toBe(false);
    });
  });

  describe("determineFileType", () => {
    test("identifies strings file", () => {
      expect(determineFileType("strings.csv")).toBe("strings");
      expect(determineFileType("test_strings_data.csv")).toBe("strings");
    });

    test("identifies classifications file", () => {
      expect(determineFileType("classifications.csv")).toBe("classifications");
      expect(determineFileType("test_classifications_data.csv")).toBe(
        "classifications"
      );
    });

    test("returns null for unknown file types", () => {
      expect(determineFileType("unknown.csv")).toBeNull();
    });
  });

  describe("validateRequiredFields", () => {
    test("validates strings data", () => {
      const data = [
        { Tier: "1", Industry: "General", Topic: "Test", Subtopic: "Sub" },
        { Tier: "", Industry: "General", Topic: "Test", Subtopic: "Sub" },
      ];

      const errors = validateRequiredFields(data, "strings");
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("Tier");
      expect(errors[0].row).toBe(2);
    });

    test("validates classifications data", () => {
      const data = [
        {
          Topic: "Test",
          SubTopic: "Sub",
          Industry: "General",
          Classification: "Standard",
        },
        {
          Topic: "",
          SubTopic: "Sub",
          Industry: "General",
          Classification: "Standard",
        },
      ];

      const errors = validateRequiredFields(data, "classifications");
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("Topic");
      expect(errors[0].row).toBe(2);
    });
  });
});
