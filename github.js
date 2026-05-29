import dotenv from "dotenv";
dotenv.config();

function extractOwnerRepo(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error("Invalid Github URL");
  return {
    owner: match[1],
    repo: match[2].replace(".git", ""),
  };
}

async function ghFetch(endpoint) {
  const header = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "obsidian-repo-mapper",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(`https://api.github.com${endpoint}`, { headers });
  if (!res.ok) throw new Error(`Github ${res.status}: ${endpoint}`);
  return res.json();
}

export async function fetchRepoData(url) {
  const { owner, repo } = extractOwnerRepo(url);

  // Parellel fetch - saves ~500ms
  const [meta, readmeRaw] = await Promise.allSettled([
    ghFetch(`/repos/${owner}/${repo}`),
    ghFetch(`/repos/${owner}/${repo}/readme`),
  ]);

  if (meta.status === "rejected") throw new Error(meta.reason.message);

  const m = meta.value;
  const readme =
    readmeRaw.status === "fulfilled"
      ? Buffer.from(readmeRaw.value.content, "base64").toString("utf-8")
      : "No README found.";

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
    readme: readme.slice(0, 8000), // cap to avoid token overflow
  };
}
