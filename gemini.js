import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildContext(repo) {
  const parts = [];

  parts.push(`--- METADATA ---
Name: ${repo.name}
Description: ${repo.description}
Language: ${repo.language} | Stars: ${repo.stars}
Topics: ${repo.topics.join(', ') || 'none'}
Archived: ${repo.isArchived} | Last Updated: ${repo.lastUpdated}`);

  if (repo.fileTree) {
    parts.push(`--- FILE STRUCTURE ---
${repo.fileTree}`);
  }

  if (repo.deps) {
    parts.push(`--- DEPENDENCIES (${repo.deps.file}) ---
${repo.deps.content}`);
  }

  // README — labelled as low-confidence if thin
  parts.push(`--- README ${repo.isReadmeThin ? '(THIN — low confidence)' : ''} ---
${repo.readme || 'Not available.'}`);

  if (repo.commits) {
    parts.push(`--- RECENT COMMITS ---
${repo.commits}`);
  }

  if (repo.entryFile) {
    parts.push(`--- ENTRY FILE (${repo.entryFile.file}, first 80 lines) ---
${repo.entryFile.content}`);
  }

  return parts.join('\n\n');
}

export async function summarizeRepo(repo) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const readmeWarning = repo.isReadmeThin
    ? `NOTE: The README for this repo is minimal or poorly written.
Do NOT rely on it as your primary source. Instead, infer what the
project actually does from the file structure, dependencies, commit
messages, and entry file. Be explicit in your output about what is
inferred vs. what is directly stated.`
    : `The README is reasonably detailed. Use it as your primary source,
supplemented by file structure and dependencies.`;

  const prompt = `
You are a developer building a personal knowledge base in Obsidian.
Think like a builder hunting for monetizable opportunities — not a student.

${readmeWarning}

Use ALL context provided below to understand what this repo actually does.
Priority order: dependencies > file structure > commits > entry file > README.

${buildContext(repo)}

Fill this template. Return ONLY the markdown. No preamble, no backticks.

---
tags: [repo]
status: researching
priority:
category:
monetization:
readme-quality: ${repo.isReadmeThin ? 'thin' : 'adequate'}
last-reviewed: ${new Date().toISOString().split('T')[0]}
---

# ${repo.name}

**Source:** ${repo.url}
**Language:** ${repo.language} | **Stars:** ${repo.stars} | **Archived:** ${repo.isArchived}

## What It Actually Does
(2-3 sentences — inferred from code/deps if README is thin.
Flag with ⚠️ Inferred if not directly stated in README.)

## Why It Matters
(Strategic relevance for a backend developer)

## Core Architecture Pattern
(Key technical design — inferred from file structure + deps if needed)

## Tech Stack
(Extract from dependency file, not just README claims)

## Monetizable Angle
(SaaS / API / automation service / dev tool)

## Signal Score
- Pain Level: /10
- Market Demand: /10
- Build Complexity: /10
- Monetization Speed: /10
- Personal Interest: /10
**Total: /50**

## Key Concepts to Link

## Confidence Note
(Was README adequate? What was inferred from code vs stated?)

## Your Notes

## Related
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}