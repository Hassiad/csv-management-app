const ValidationService = require("../src/services/validationService");

describe("ValidationService", () => {
  const sampleClassifications = [
    {
      Topic: "Compliance",
      SubTopic: "Audit Findings",
      Industry: "General",
      Classification: "Standard",
    },
    {
      Topic: "Finance",
      SubTopic: "Budget Proposals",
      Industry: "General",
      Classification: "Standard",
    },
    {
      Topic: "Security",
      SubTopic: "Cybersecurity",
      Industry: "Healthcare",
      Classification: "Standard",
    },
  ];

  const validStringsData = [
    {
      Tier: "1",
      Industry: "General",
      Topic: "Compliance",
      Subtopic: "Audit Findings",
      Prefix: "Co-Au-",
    },
    {
      Tier: "1",
      Industry: "General",
      Topic: "Finance",
      Subtopic: "Budget Proposals",
      Prefix: "Fi-Bu-",
    },
  ];

  const invalidStringsData = [
    {
      Tier: "1",
      Industry: "General",
      Topic: "InvalidTopic",
      Subtopic: "InvalidSubtopic",
      Prefix: "Iv-Iv-",
    },
    {
      Tier: "1",
      Industry: "Healthcare",
      Topic: "Security",
      Subtopic: "Cybersecurity",
      Prefix: "Se-Cy-",
    },
  ];

  describe("validateDataIntegrity", () => {
    test("should validate correct data combinations", () => {
      const result = ValidationService.validateDataIntegrity(
        validStringsData,
        sampleClassifications
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalStringsRows).toBe(2);
    });

    test("should detect invalid combinations", () => {
      const result = ValidationService.validateDataIntegrity(
        invalidStringsData,
        sampleClassifications
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("invalid_combination");
    });

    test("should handle missing required fields", () => {
      const incompleteData = [
        {
          Tier: "1",
          Industry: "General",
          Topic: "",
          Subtopic: "Audit Findings",
        },
      ];

      const result = ValidationService.validateDataIntegrity(
        incompleteData,
        sampleClassifications
      );

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) => error.type === "missing_required_field")
      ).toBe(true);
    });
  });

  describe("validateCSVStructure", () => {
    test("should validate proper CSV structure", () => {
      const headers = ["Tier", "Industry", "Topic"];
      const data = [{ Tier: "1", Industry: "General", Topic: "Compliance" }];

      const result = ValidationService.validateCSVStructure(
        data,
        headers,
        "strings"
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should detect empty files", () => {
      const result = ValidationService.validateCSVStructure(
        [],
        ["Tier"],
        "strings"
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("empty_file");
    });
  });

  describe("validateRowData", () => {
    test("should validate required fields for strings", () => {
      const validRow = {
        Tier: "1",
        Industry: "General",
        Topic: "Compliance",
        Subtopic: "Audit",
      };

      const result = ValidationService.validateRowData(validRow, "strings");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should detect missing required fields", () => {
      const invalidRow = {
        Tier: "1",
        Industry: "",
        Topic: "Compliance",
        Subtopic: "",
      };

      const result = ValidationService.validateRowData(invalidRow, "strings");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
