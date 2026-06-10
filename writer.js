import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9\-_]/g, "-").toLowerCase();
}

export async function writeToVault(repoName, content) {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) throw new Error("OBSIDIAN_VAULT_PATH not set in .env");

  const dir = path.join(vaultPath, "Resources", "GitHub Repositories");
  await fs.mkdir(dir, { recursive: true });

  const filename = `${sanitize(repoName)}.md`;
  const filePath = path.join(dir, filename);

  // Skip if already exists — don't overwrite your manual edits
  try {
    await fs.access(filePath);
    console.log(`⏭️  Already exists: ${filename} — skipping`);
    return filePath;
  } catch {
    // File doesn't exist — safe to write
  }

  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}
