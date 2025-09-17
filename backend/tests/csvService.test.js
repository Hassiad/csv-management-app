const CsvService = require("../src/services/csvService");
const path = require("path");
const fs = require("fs").promises;

describe("CsvService", () => {
  const testSessionId = "test-session-123";
  const testFile = {
    path: path.join(__dirname, "fixtures/test-strings.csv"),
    originalname: "test-strings.csv",
  };

  beforeAll(async () => {
    // Create test fixtures directory
    const fixturesDir = path.join(__dirname, "fixtures");
    await fs.mkdir(fixturesDir, { recursive: true });

    // Create test CSV file
    const testCsvContent = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,General,Compliance,Audit Findings,Co-Au-,0,What significant issues were highlighted in the recent compliance audits that remain unresolved?,,
1,General,Compliance,Bribery and Unethical Practices,Co-Br-,0,What instances of exchanging gifts for services were identified this year?,,`;

    await fs.writeFile(testFile.path, testCsvContent);
  });

  afterAll(async () => {
    // Cleanup test fixtures
    try {
      await fs.unlink(testFile.path);
      await fs.rmdir(path.join(__dirname, "fixtures"));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("uploadCSV", () => {
    test("should successfully parse and store CSV data", async () => {
      const result = await CsvService.uploadCSV(testFile, "strings");

      expect(result).toHaveProperty("sessionId");
      expect(result).toHaveProperty("fileType", "strings");
      expect(result).toHaveProperty("headers");
      expect(result).toHaveProperty("data");
      expect(result.data).toHaveLength(2);
      expect(result.headers).toContain("Tier");
      expect(result.headers).toContain("Industry");
    });

    test("should reject file with invalid headers", async () => {
      const invalidFile = {
        path: path.join(__dirname, "fixtures/invalid-test.csv"),
        originalname: "invalid-test.csv",
      };

      const invalidCsvContent = `Wrong,Headers,Format\n1,2,3`;
      await fs.writeFile(invalidFile.path, invalidCsvContent);

      await expect(
        CsvService.uploadCSV(invalidFile, "strings")
      ).rejects.toThrow("Invalid headers");

      // Cleanup
      await fs.unlink(invalidFile.path);
    });
  });

  describe("getExpectedHeaders", () => {
    test("should return correct headers for strings file type", () => {
      const headers = CsvService.getExpectedHeaders("strings");
      expect(headers).toEqual([
        "Tier",
        "Industry",
        "Topic",
        "Subtopic",
        "Prefix",
        "Fuzzing-Idx",
        "Prompt",
        "Risks",
        "Keywords",
      ]);
    });

    test("should return correct headers for classifications file type", () => {
      const headers = CsvService.getExpectedHeaders("classifications");
      expect(headers).toEqual([
        "Topic",
        "SubTopic",
        "Industry",
        "Classification",
      ]);
    });

    test("should return empty array for unknown file type", () => {
      const headers = CsvService.getExpectedHeaders("unknown");
      expect(headers).toEqual([]);
    });
  });
});
