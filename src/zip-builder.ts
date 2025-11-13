import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";
import { Meta } from "./types";
import { normalizeEmojiName } from "./emoji-processor";

/**
 * Create a zip file for Misskey emoji import
 * @param meta Meta object containing emoji information
 * @param categoryMap Map of category to file paths
 * @param outputPath Output zip file path
 */
export async function createEmojiZip(
  meta: Meta,
  categoryMap: Map<string, string[]>,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on("close", () => {
      console.log(`Created ${outputPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add meta.json
    archive.append(JSON.stringify(meta, null, 2), { name: "meta.json" });

    // Create a map from new filename to original filepath
    const fileMap = new Map<string, string>();
    for (const [category, files] of categoryMap.entries()) {
      for (const filePath of files) {
        const originalFileName = path.basename(filePath);
        const ext = path.extname(originalFileName);
        const nameWithoutExt = path.basename(originalFileName, ext);
        const normalizedName = normalizeEmojiName(nameWithoutExt);
        const normalizedCategory = normalizeEmojiName(category);
        const newFileName = `${normalizedCategory}_${normalizedName}${ext}`;
        fileMap.set(newFileName, filePath);
      }
    }

    // Add all emoji files
    for (const entry of meta.emojis) {
      const originalPath = fileMap.get(entry.fileName);
      if (originalPath && fs.existsSync(originalPath)) {
        archive.file(originalPath, { name: entry.fileName });
      } else {
        console.warn(`Warning: File not found for ${entry.fileName}`);
      }
    }

    archive.finalize();
  });
}
