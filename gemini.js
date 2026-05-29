import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function summarizeRepo(repo) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are a developer building a personal knowledge base in Obsidian.
Think like a builder hunting for monetizable opportunities — not a student taking notes.

Given this repository data, fill in the template below.
Return ONLY the markdown. No preamble, no backticks, no explanation.

--- REPO DATA ---
Name: ${repo.name}
Description: ${repo.description}
Language: ${repo.language}
Stars: ${repo.stars}
Topics: ${repo.topics.join(", ")}
Archived: ${repo.isArchived}
Last Updated: ${repo.lastUpdated}

--- README ---
${repo.readme}

--- TEMPLATE TO FILL ---
---
tags: [repo]
status: researching
priority: 
category: 
monetization: 
last-reviewed: ${new Date().toISOString().split("T")[0]}
---

# ${repo.name}

**Source:** ${repo.url}
**Language:** ${repo.language} | **Stars:** ${repo.stars} | **Archived:** ${repo.isArchived}

## What It Solves
(2-3 sentences max)

## Why It Matters
(Strategic relevance for a backend developer)

## Core Architecture Pattern
(Key technical innovation or design pattern)

## Tech Stack
-

## Monetizable Angle
(SaaS / API / automation service / dev tool angle)

## Signal Score
- Pain Level: /10
- Market Demand: /10
- Build Complexity: /10
- Monetization Speed: /10
- Personal Interest: /10
**Total: /50**

## Key Concepts to Link
(Bullet list — concepts worth linking to other notes)

## Your Notes


## Related
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
