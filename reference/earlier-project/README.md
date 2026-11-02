# CashFlow AI — SME Cash Flow Intelligence Prototype

A static, browser-based prototype for SME cash-flow analysis and business decision support.

## Run locally

1. Extract this archive.
2. Open a terminal in the outputs directory.
3. Serve the directory with a local static server, for example:

   python -m http.server 8000

4. Visit http://localhost:8000.

The app is a static HTML/JavaScript prototype. Its account experience is browser-local and is not server-side authentication. Demo datasets and rule-based analysis are illustrative; no live business-system integrations or autonomous LLM reasoning are included.

## Source layout

- outputs/index.html — application shell and page markup
- outputs/*.js — page logic, shared demo data, orchestration, language and UI behavior
- outputs/demo-data/ — fixed simulated company datasets and data dictionary
- PROJECT_HANDOFF.md — current architecture, development status, and next task

## Publish to GitHub

Create a GitHub repository, then upload the extracted project files or initialize Git in the extracted root and push them. This archive does not contain Git history or Wrangler authentication/cache files.
