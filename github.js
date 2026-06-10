import dotenv from "dotenv";
dotenv.config();

function extractOwnerRepo(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");
  return { owner: match[1], repo: match[2].replace(".git", "") };
}

async function ghFetch(endpoint) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "obsidian-repo-mapper",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(`https://api.github.com${endpoint}`, { headers });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${endpoint}`);
  return res.json();
}

// Top-level file/folder structure — reveals architecture instantly
async function fetchFileTree(owner, repo) {
  try {
    const items = await ghFetch(`/repos/${owner}/${repo}/contents/`);
    return items
      .map((i) => `${i.type === "dir" ? "📁" : "📄"} ${i.name}`)
      .join("\n");
  } catch {
    return null;
  }
}

// Dependency file — ground truth on tech stack
// Tries each in order, returns the first one found
async function fetchDependencyFile(owner, repo) {
  const candidates = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "composer.json",
  ];

  for (const file of candidates) {
    try {
      const data = await ghFetch(`/repos/${owner}/${repo}/contents/${file}`);
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { file, content: content.slice(0, 2000) };
    } catch {
      continue;
    }
  }
  return null;
}

// Last 15 commit messages — shows what's actively being built
async function fetchCommits(owner, repo) {
  try {
    const commits = await ghFetch(
      `/repos/${owner}/${repo}/commits?per_page=15`,
    );
    return commits
      .map((c) => c.commit.message.split("\n")[0]) // first line only
      .join("\n");
  } catch {
    return null;
  }
}

// Entry file — first 80 lines usually reveals the core logic
async function fetchEntryFile(owner, repo) {
  const candidates = [
    "index.js",
    "main.js",
    "app.js",
    "server.js",
    "main.py",
    "app.py",
    "server.py",
    "main.go",
    "main.rs",
    "Main.java",
  ];

  for (const file of candidates) {
    try {
      const data = await ghFetch(`/repos/${owner}/${repo}/contents/${file}`);
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      const lines = content.split("\n").slice(0, 80).join("\n");
      return { file, content: lines };
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchRepoData(url) {
  const { owner, repo } = extractOwnerRepo(url);

  // Step 1: fetch metadata + README in parallel
  const [metaResult, readmeResult] = await Promise.allSettled([
    ghFetch(`/repos/${owner}/${repo}`),
    ghFetch(`/repos/${owner}/${repo}/readme`),
  ]);

  if (metaResult.status === "rejected")
    throw new Error(metaResult.reason.message);

  const m = metaResult.value;
  const readme =
    readmeResult.status === "fulfilled"
      ? Buffer.from(readmeResult.value.content, "base64")
          .toString("utf-8")
          .slice(0, 6000)
      : "";

  // Step 2: detect thin README (under 400 chars = basically useless)
  const isReadmeThin = readme.replace(/\s/g, "").length < 400;
  console.log(
    isReadmeThin
      ? "⚠️  Thin README — pulling extra context"
      : "✅ README looks solid",
  );

  // Step 3: always fetch tree + deps
  // fetch entry file + commits only if README is thin
  const [treeResult, depsResult, commitsResult, entryResult] =
    await Promise.allSettled([
      fetchFileTree(owner, repo),
      fetchDependencyFile(owner, repo),
      isReadmeThin ? fetchCommits(owner, repo) : Promise.resolve(null),
      isReadmeThin ? fetchEntryFile(owner, repo) : Promise.resolve(null),
    ]);

  return {
    name: m.name,
    fullName: m.full_name,
    url: m.html_url,
    description: m.description ?? "No description",
    language: m.language ?? "Unknown",
    stars: m.stargazers_count,
    topics: m.topics ?? [],
    isArchived: m.archived,
    lastUpdated: m.updated_at,
    readme,
    isReadmeThin,
    fileTree: treeResult.value ?? null,
    deps: depsResult.value ?? null,
    commits: commitsResult.value ?? null,
    entryFile: entryResult.value ?? null,
  };
}
