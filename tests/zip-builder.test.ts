import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import AdmZip from "adm-zip";
import { createEmojiZip } from "../src/zip-builder";
import { Meta } from "../src/types";

describe("createEmojiZip", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zip-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should create a zip file with meta.json and emoji files", async () => {
    // Create test files
    const testFile1 = path.join(tempDir, "test1.png");
    const testFile2 = path.join(tempDir, "test2.gif");
    fs.writeFileSync(testFile1, "test content 1");
    fs.writeFileSync(testFile2, "test content 2");

    const categoryMap = new Map<string, string[]>();
    categoryMap.set("test", [testFile1, testFile2]);

    const meta: Meta = {
      emojis: [
        {
          downloaded: true,
          fileName: "test_test1.png",
          emoji: {
            name: "test_test1",
            category: "test",
            aliases: ["test", "てすと1"],
          },
        },
        {
          downloaded: true,
          fileName: "test_test2.gif",
          emoji: {
            name: "test_test2",
            category: "test",
            aliases: ["test", "てすと2"],
          },
        },
      ],
    };

    const outputPath = path.join(tempDir, "output.zip");
    await createEmojiZip(meta, categoryMap, outputPath);

    // Verify zip file was created
    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify zip contents
    const zip = new AdmZip(outputPath);
    const zipEntries = zip.getEntries();

    // Should contain meta.json + 2 emoji files
    expect(zipEntries.length).toBe(3);

    // Check meta.json exists
    const metaEntry = zipEntries.find((e) => e.entryName === "meta.json");
    expect(metaEntry).toBeDefined();

    // Check emoji files exist
    const emoji1Entry = zipEntries.find(
      (e) => e.entryName === "test_test1.png"
    );
    const emoji2Entry = zipEntries.find(
      (e) => e.entryName === "test_test2.gif"
    );
    expect(emoji1Entry).toBeDefined();
    expect(emoji2Entry).toBeDefined();
  });

  it("should include valid JSON in meta.json", async () => {
    const testFile = path.join(tempDir, "test.png");
    fs.writeFileSync(testFile, "test content");

    const categoryMap = new Map<string, string[]>();
    categoryMap.set("test", [testFile]);

    const meta: Meta = {
      emojis: [
        {
          downloaded: true,
          fileName: "test_test.png",
          emoji: {
            name: "test_test",
            category: "test",
            aliases: ["test"],
          },
        },
      ],
    };

    const outputPath = path.join(tempDir, "output.zip");
    await createEmojiZip(meta, categoryMap, outputPath);

    const zip = new AdmZip(outputPath);
    const metaEntry = zip.getEntry("meta.json");
    expect(metaEntry).toBeDefined();

    if (metaEntry) {
      const metaContent = metaEntry.getData().toString("utf8");
      const parsedMeta = JSON.parse(metaContent);

      expect(parsedMeta).toEqual(meta);
    }
  });

  it("should handle files with hyphens in names", async () => {
    const testFile = path.join(tempDir, "test-file.png");
    fs.writeFileSync(testFile, "test content");

    const categoryMap = new Map<string, string[]>();
    categoryMap.set("category", [testFile]);

    const meta: Meta = {
      emojis: [
        {
          downloaded: true,
          fileName: "category_test_file.png",
          emoji: {
            name: "category_test_file",
            category: "category",
            aliases: ["category", "test", "file"],
          },
        },
      ],
    };

    const outputPath = path.join(tempDir, "output.zip");
    await createEmojiZip(meta, categoryMap, outputPath);

    const zip = new AdmZip(outputPath);
    const emojiEntry = zip.getEntry("category_test_file.png");
    expect(emojiEntry).toBeDefined();
  });

  it("should create zip file at specified path", async () => {
    const testFile = path.join(tempDir, "test.png");
    fs.writeFileSync(testFile, "test");

    const categoryMap = new Map<string, string[]>();
    categoryMap.set("test", [testFile]);

    const meta: Meta = {
      emojis: [
        {
          downloaded: true,
          fileName: "test_test.png",
          emoji: { name: "test_test", category: "test", aliases: [] },
        },
      ],
    };

    const customOutputPath = path.join(tempDir, "custom", "output.zip");
    fs.mkdirSync(path.dirname(customOutputPath), { recursive: true });

    await createEmojiZip(meta, categoryMap, customOutputPath);

    expect(fs.existsSync(customOutputPath)).toBe(true);
  });
});
