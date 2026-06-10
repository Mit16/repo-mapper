import { fetchRepoData } from "./github.js";
import { summarizeRepo } from "./gemini.js";
import { writeToVault } from "./writer.js";

const url = process.argv[2];

if (!url) {
  console.error("Usage: node index.js <github-url>");
  process.exit(1);
}

async function main() {
  try {
    console.log("🔍 Fetching repo data...");
    const repoData = await fetchRepoData(url);

    console.log(`📦 Found: ${repoData.name} (⭐ ${repoData.stars})`);

    if (repoData.isArchived) {
      console.log("⚠️  Repo is archived — continuing anyway");
    }

    console.log("🤖 Summarizing with Gemini...");
    const note = await summarizeRepo(repoData);

    console.log("📝 Writing to Obsidian vault...");
    const filePath = await writeToVault(repoData.name, note);

    console.log(`✅ Done → ${filePath}`);
  } catch (error) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
