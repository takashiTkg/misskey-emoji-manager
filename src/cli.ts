#!/usr/bin/env node

import { Command } from "commander";
import * as path from "path";
import { scanEmojiFiles, buildMeta } from "./emoji-processor";
import { createEmojiZip } from "./zip-builder";

const program = new Command();

program
  .name("misskey-emoji-manager")
  .description("Create Misskey custom emoji import zip files")
  .version("1.0.0");

program
  .command("pack")
  .description("Create a zip file from emoji images in directories")
  .argument(
    "<input>",
    "Input directory containing emoji images (subdirectories will be used as categories)"
  )
  .argument("[output]", "Output zip file path", "emoji-pack.zip")
  .action(async (input: string, output: string) => {
    try {
      console.log("Scanning emoji files...");
      const categoryMap = scanEmojiFiles(input);

      if (categoryMap.size === 0) {
        console.error("No emoji files found in the specified directory");
        process.exit(1);
      }

      console.log(`Found ${categoryMap.size} categories:`);
      for (const [category, files] of categoryMap.entries()) {
        console.log(`  - ${category}: ${files.length} files`);
      }

      console.log("\nBuilding metadata...");
      const meta = buildMeta(categoryMap);

      console.log(`Total emojis: ${meta.emojis.length}`);

      console.log("\nCreating zip file...");
      const outputPath = path.resolve(output);
      await createEmojiZip(meta, categoryMap, outputPath);

      console.log("\nDone!");
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse();
