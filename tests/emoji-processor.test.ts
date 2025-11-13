import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  processEmojiName,
  generateAliases,
  scanEmojiFiles,
  buildMeta,
  normalizeEmojiName,
  isValidEmojiName,
} from "../src/emoji-processor";

describe("normalizeEmojiName", () => {
  it("should convert hyphens to underscores", () => {
    expect(normalizeEmojiName("test-emoji")).toBe("test_emoji");
    expect(normalizeEmojiName("super-long-name")).toBe("super_long_name");
  });

  it("should remove spaces", () => {
    expect(normalizeEmojiName("test emoji")).toBe("testemoji");
    expect(normalizeEmojiName("my emoji name")).toBe("myemojiname");
  });

  it("should handle both hyphens and spaces", () => {
    expect(normalizeEmojiName("test-emoji name")).toBe("test_emojiname");
    expect(normalizeEmojiName("my-test emoji")).toBe("my_testemoji");
  });

  it("should handle names without hyphens or spaces", () => {
    expect(normalizeEmojiName("emoji")).toBe("emoji");
    expect(normalizeEmojiName("test123")).toBe("test123");
  });

  it("should preserve dots and underscores", () => {
    expect(normalizeEmojiName("test_emoji.v2")).toBe("test_emoji.v2");
  });
});

describe("isValidEmojiName", () => {
  it("should accept valid emoji names", () => {
    expect(isValidEmojiName("test_emoji")).toBe(true);
    expect(isValidEmojiName("emoji123")).toBe(true);
    expect(isValidEmojiName("Test_Emoji")).toBe(true);
    expect(isValidEmojiName("emoji.v2")).toBe(true);
    expect(isValidEmojiName("category_emoji_name")).toBe(true);
  });

  it("should reject emoji names with invalid characters", () => {
    expect(isValidEmojiName("test-emoji")).toBe(false);
    expect(isValidEmojiName("test emoji")).toBe(false);
    expect(isValidEmojiName("test@emoji")).toBe(false);
    expect(isValidEmojiName("test!emoji")).toBe(false);
    expect(isValidEmojiName("絵文字")).toBe(false);
    expect(isValidEmojiName("emoji#tag")).toBe(false);
  });

  it("should reject empty strings", () => {
    expect(isValidEmojiName("")).toBe(false);
  });
});

describe("processEmojiName", () => {
  it("should add category prefix and convert hyphens to underscores", () => {
    expect(processEmojiName("neko.png", "animals")).toBe("animals_neko");
    expect(processEmojiName("inu-san.gif", "animals")).toBe("animals_inu_san");
    expect(processEmojiName("sushi-maki.png", "food")).toBe("food_sushi_maki");
  });

  it("should handle files without hyphens", () => {
    expect(processEmojiName("cat.png", "animals")).toBe("animals_cat");
  });

  it("should handle multiple hyphens", () => {
    expect(processEmojiName("super-long-name.png", "category")).toBe(
      "category_super_long_name"
    );
  });

  it("should remove spaces (NG1 case)", () => {
    expect(processEmojiName("test emoji.png", "category")).toBe(
      "category_testemoji"
    );
    expect(processEmojiName("my emoji name.png", "category")).toBe(
      "category_myemojiname"
    );
  });

  it("should handle both hyphens and spaces (NG1 case)", () => {
    expect(processEmojiName("test-emoji name.png", "category")).toBe(
      "category_test_emojiname"
    );
  });

  it("should return null for invalid emoji names (NG2 case)", () => {
    expect(processEmojiName("絵文字.png", "category")).toBeNull();
    expect(processEmojiName("emoji@test.png", "category")).toBeNull();
    expect(processEmojiName("emoji!test.png", "category")).toBeNull();
    expect(processEmojiName("emoji#tag.png", "category")).toBeNull();
    expect(processEmojiName("test🎉.png", "category")).toBeNull();
  });
});

describe("generateAliases", () => {
  it("should include category name in aliases", () => {
    const aliases = generateAliases("animals_neko");
    expect(aliases).toContain("animals");
  });

  it("should convert romaji segments to hiragana", () => {
    const aliases = generateAliases("animals_neko");
    expect(aliases).toContain("ねこ");
  });

  it("should convert multiple segments", () => {
    const aliases = generateAliases("animals_inu_san");
    expect(aliases).toContain("animals");
    expect(aliases).toContain("いぬ");
    expect(aliases).toContain("さん");
  });

  it("should convert full name without category", () => {
    const aliases = generateAliases("food_sushi_maki");
    expect(aliases).toContain("すし");
    expect(aliases).toContain("まき");
    expect(aliases).toContain("すしまき");
  });

  it("should handle names with only category", () => {
    const aliases = generateAliases("animals");
    expect(aliases).toEqual([]);
  });

  it("should not duplicate aliases", () => {
    const aliases = generateAliases("food_sushi_maki");
    const uniqueAliases = [...new Set(aliases)];
    expect(aliases.length).toBe(uniqueAliases.length);
  });
});

describe("scanEmojiFiles", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "emoji-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should scan subdirectories as categories", () => {
    // Create test structure
    const animalsDir = path.join(tempDir, "animals");
    const foodDir = path.join(tempDir, "food");
    fs.mkdirSync(animalsDir);
    fs.mkdirSync(foodDir);

    fs.writeFileSync(path.join(animalsDir, "cat.png"), "test");
    fs.writeFileSync(path.join(animalsDir, "dog.gif"), "test");
    fs.writeFileSync(path.join(foodDir, "pizza.png"), "test");

    const result = scanEmojiFiles(tempDir);

    expect(result.size).toBe(2);
    expect(result.get("animals")).toHaveLength(2);
    expect(result.get("food")).toHaveLength(1);
  });

  it("should support multiple image formats", () => {
    const categoryDir = path.join(tempDir, "test");
    fs.mkdirSync(categoryDir);

    fs.writeFileSync(path.join(categoryDir, "image1.png"), "test");
    fs.writeFileSync(path.join(categoryDir, "image2.gif"), "test");
    fs.writeFileSync(path.join(categoryDir, "image3.jpg"), "test");
    fs.writeFileSync(path.join(categoryDir, "image4.jpeg"), "test");

    const result = scanEmojiFiles(tempDir);

    expect(result.get("test")).toHaveLength(4);
  });

  it("should ignore non-image files", () => {
    const categoryDir = path.join(tempDir, "test");
    fs.mkdirSync(categoryDir);

    fs.writeFileSync(path.join(categoryDir, "image.png"), "test");
    fs.writeFileSync(path.join(categoryDir, "readme.txt"), "test");
    fs.writeFileSync(path.join(categoryDir, "data.json"), "test");

    const result = scanEmojiFiles(tempDir);

    expect(result.get("test")).toHaveLength(1);
  });

  it("should handle empty directories", () => {
    const categoryDir = path.join(tempDir, "empty");
    fs.mkdirSync(categoryDir);

    const result = scanEmojiFiles(tempDir);

    expect(result.size).toBe(0);
  });
});

describe("buildMeta", () => {
  it("should build meta structure from category map", () => {
    const categoryMap = new Map<string, string[]>();
    categoryMap.set("animals", ["/path/to/neko.png", "/path/to/inu-san.gif"]);
    categoryMap.set("food", ["/path/to/ramen.png"]);

    const meta = buildMeta(categoryMap);

    expect(meta.emojis).toHaveLength(3);
    expect(meta.emojis[0].downloaded).toBe(true);
    expect(meta.emojis[0].fileName).toBe("animals_neko.png");
    expect(meta.emojis[0].emoji.name).toBe("animals_neko");
    expect(meta.emojis[0].emoji.category).toBe("animals");
    expect(meta.emojis[0].emoji.aliases).toContain("animals");
    expect(meta.emojis[0].emoji.aliases).toContain("ねこ");
  });

  it("should handle files with hyphens", () => {
    const categoryMap = new Map<string, string[]>();
    categoryMap.set("test", ["/path/to/test-file.png"]);

    const meta = buildMeta(categoryMap);

    expect(meta.emojis[0].fileName).toBe("test_test_file.png");
    expect(meta.emojis[0].emoji.name).toBe("test_test_file");
  });

  it("should preserve file extensions", () => {
    const categoryMap = new Map<string, string[]>();
    categoryMap.set("test", [
      "/path/to/image.png",
      "/path/to/image.gif",
      "/path/to/image.jpg",
    ]);

    const meta = buildMeta(categoryMap);

    expect(meta.emojis[0].fileName).toMatch(/\.png$/);
    expect(meta.emojis[1].fileName).toMatch(/\.gif$/);
    expect(meta.emojis[2].fileName).toMatch(/\.jpg$/);
  });

  it("should handle files with spaces (NG1 case)", () => {
    const categoryMap = new Map<string, string[]>();
    categoryMap.set("test", ["/path/to/test emoji.png"]);

    const meta = buildMeta(categoryMap);

    expect(meta.emojis).toHaveLength(1);
    expect(meta.emojis[0].fileName).toBe("test_testemoji.png");
    expect(meta.emojis[0].emoji.name).toBe("test_testemoji");
  });

  it("should skip invalid emoji names (NG2 case)", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const categoryMap = new Map<string, string[]>();
    categoryMap.set("test", [
      "/path/to/valid.png",
      "/path/to/絵文字.png",
      "/path/to/emoji@invalid.png",
    ]);

    const meta = buildMeta(categoryMap);

    // Should only include the valid emoji
    expect(meta.emojis).toHaveLength(1);
    expect(meta.emojis[0].fileName).toBe("test_valid.png");

    // Should have logged errors for invalid files
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[NG2] Invalid emoji name (skipped):")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("絵文字.png")
    );

    consoleSpy.mockRestore();
  });

  it("should handle mixed valid, NG1, and NG2 cases", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const categoryMap = new Map<string, string[]>();
    categoryMap.set("test", [
      "/path/to/normal.png",
      "/path/to/with-hyphen.png",
      "/path/to/with space.png",
      "/path/to/invalid@.png",
    ]);

    const meta = buildMeta(categoryMap);

    // Should include: normal (OK), with-hyphen (NG1), with space (NG1)
    // Should skip: invalid@ (NG2)
    expect(meta.emojis).toHaveLength(3);
    expect(meta.emojis[0].emoji.name).toBe("test_normal");
    expect(meta.emojis[1].emoji.name).toBe("test_with_hyphen");
    expect(meta.emojis[2].emoji.name).toBe("test_withspace");

    // Should have logged error for invalid file
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
