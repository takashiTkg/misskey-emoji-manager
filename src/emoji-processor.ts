import * as fs from "fs";
import * as path from "path";
import { toHiragana } from "@koozaki/romaji-conv";
import { EmojiEntry, Meta } from "./types";

export interface ProcessOptions {
  inputDir: string;
  outputZip: string;
}

/**
 * Scan a directory recursively and find all emoji image files
 * Each subdirectory name becomes a category
 */
export function scanEmojiFiles(inputDir: string): Map<string, string[]> {
  const categoryMap = new Map<string, string[]>();

  function scanDir(dir: string, category: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Use directory name as category
        scanDir(fullPath, entry.name);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (
          ext === ".png" ||
          ext === ".gif" ||
          ext === ".jpg" ||
          ext === ".jpeg"
        ) {
          if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
          }
          categoryMap.get(category)!.push(fullPath);
        }
      }
    }
  }

  // Start scanning - if input is a directory with subdirectories, use those as categories
  // Otherwise use the directory name itself
  const stat = fs.statSync(inputDir);
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(inputDir, { withFileTypes: true });
    const hasSubdirs = entries.some((e) => e.isDirectory());

    if (hasSubdirs) {
      // Scan each subdirectory as a category
      scanDir(inputDir, "");
    } else {
      // Use the directory name as category
      const category = path.basename(inputDir);
      scanDir(inputDir, category);
    }
  }

  return categoryMap;
}

/**
 * Process emoji name:
 * - Add category prefix
 * - Convert hyphens to underscores
 */
export function processEmojiName(fileName: string, category: string): string {
  const nameWithoutExt = path.basename(fileName, path.extname(fileName));
  const normalized = nameWithoutExt.replace(/-/g, "_");
  return `${category}_${normalized}`;
}

/**
 * Generate aliases by converting romaji segments to hiragana
 * Split by underscore and convert each segment
 */
export function generateAliases(name: string): string[] {
  const aliases: string[] = [];

  // Split by underscore
  const segments = name.split("_");
  if (segments.length < 2) {
    return aliases;
  }

  // Add category (first segment) as-is without conversion
  const category = segments[0];
  aliases.push(category);

  // Convert name segments (excluding category prefix)
  const nameSegments = segments.slice(1);

  // Convert each segment from romaji to hiragana
  for (const segment of nameSegments) {
    try {
      const hiragana = toHiragana(segment);
      if (hiragana && hiragana !== segment) {
        aliases.push(hiragana);
      }
    } catch (e) {
      // If conversion fails, skip this segment
      console.warn(`Failed to convert "${segment}" to hiragana:`, e);
    }
  }

  // Also try converting the whole name (without prefix) as one string
  const fullName = nameSegments.join("");
  try {
    const hiragana = toHiragana(fullName);
    if (hiragana && hiragana !== fullName && !aliases.includes(hiragana)) {
      aliases.push(hiragana);
    }
  } catch (e) {
    console.warn(`Failed to convert full name "${fullName}" to hiragana:`, e);
  }

  return aliases;
}

/**
 * Build meta.json structure from scanned files
 */
export function buildMeta(categoryMap: Map<string, string[]>): Meta {
  const emojis: EmojiEntry[] = [];

  for (const [category, files] of categoryMap.entries()) {
    for (const filePath of files) {
      const originalFileName = path.basename(filePath);
      const emojiName = processEmojiName(originalFileName, category);
      const aliases = generateAliases(emojiName);
      const ext = path.extname(originalFileName);
      const newFileName = `${emojiName}${ext}`;

      emojis.push({
        downloaded: true,
        fileName: newFileName,
        emoji: {
          name: emojiName,
          category: category,
          aliases: aliases,
        },
      });
    }
  }

  return { emojis };
}
