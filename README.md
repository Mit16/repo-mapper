# repo-mapper

> Turn any GitHub repo into a structured Obsidian note — automatically.

Paste a GitHub URL. Get a fully formatted Obsidian note with signal scoring, monetizable angles, and wikilinks — written directly into your vault.

---

## Demo

<!-- Add a GIF here. Record terminal + Obsidian side by side. 
     Use asciinema or just screen record 30 seconds. 
     This is the single most important thing in your README. -->

![demo](./assets/demo.gif)

---

## What It Does

1. Fetches repo metadata + README from GitHub API  
2. Sends it to Gemini with a builder-focused prompt  
3. Writes a structured `.md` note directly into your Obsidian vault  

No manual copy-pasting. No raw README dumps. Actual intelligence extraction.

---

## Quick Start

```bash
git clone https://github.com/highoncodes/repo-mapper
cd repo-mapper
npm install
cp .env.example .env   # fill in your keys
node index.js https://github.com/langchain-ai/langchain
```

Your vault gets a new note at `Resources/Repos/langchain.md` instantly.

---

## Output Format

Each note includes:

- What the repo solves + why it matters
- Core architecture pattern
- Tech stack
- Monetizable angle (SaaS / API / automation service)
- Signal score (pain level, market demand, build complexity)
- Frontmatter for Dataview queries

---

## Configuration

```env
GEMINI_API_KEY=       # aistudio.google.com — free
GITHUB_TOKEN=         # optional, raises rate limit to 5000/hr
OBSIDIAN_VAULT_PATH=  # absolute path to your vault folder
```

---

## Batch Mode

Process multiple repos at once:

```bash
# Put URLs in urls.txt, one per line
node batch.js
```

---

## Built With

- Node.js (ESM)
- GitHub REST API
- Google Gemini 1.5 Flash

---

## Roadmap

- [ ] Batch processing from `urls.txt`
- [ ] Auto-fork high-scored repos
- [ ] Dataview dashboard template
- [ ] Browser extension (right-click any GitHub repo)

---

## License

MIT
