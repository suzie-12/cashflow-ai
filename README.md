# CashFlow AI

A browser-based SME finance and decision-support **prototype**. This repository contains the complete current application source from the November 3, 2026 chat, including the latest darker sidebar wordmark.

UI baseline: https://6ce8850e.sme-cashflow-ai.pages.dev/#overview

This combined source export merges the second chat’s analysis snapshot/run protection into the latest application. The merged package has not been deployed to the hosted website. See `docs/MERGE-REPORT.md`.

## Run locally

Install Node.js 20 or later, then from this folder:

```sh
npm start
```

Open http://localhost:3000. No dependency installation or build is required to run the app. Create a demo account in that browser. Existing accounts from the hosted website will not transfer to localhost.

Do not open `index.html` by double-clicking: the local account prototype requires a secure browser context such as localhost. The local server binds to your own computer only. Set `CASHFLOW_PORT` if port 3000 is occupied.

## Source layout

| Path | Purpose |
| --- | --- |
| `site/index.html` | SPA shell, styles, local login, input modal, and retained legacy inline modules |
| `site/dynamic-skill-orchestration.js` | Evidence-based assessment, dynamic skill selection, analytical views and routing |
| `site/overview-state.js` | Button-first Overview with a single active state and renderer |
| `site/failure-recovery.js` | Linked failure/correction panels and validated 15-day-delay recovery simulation |
| `site/scenario-controls.js` | Simplified input actions, validation, drafts, 20 business types and custom entry |
| `site/demo-dataset.js` | Deterministic simulated company datasets and CSV serialization |
| `site/demo-csv-import.js` | Business CSV parsing, validation and import preview |
| `site/decision-synthesis.js` | Decision synthesis UI |
| `site/market-data-import.js` | Source-labelled market CSV import |
| `site/auth-profile.js` | Browser-local accounts and profile management |
| `site/*i18n*.js`, `site/workspace-language.js` | Existing language support |
| `site/workspace-polish.js` | Workspace presentation helpers |
| `demo-data/` | Tested judges' CSV and Chinese demonstration instructions |
| `verify-*.cjs` | Browser regression checks |
| `generate-judges-demo.cjs` | Reproducible demo CSV generation |
| `scripts/` | Dependency-free local server, source checks and test runner |
| `docs/` | Original handoff and current architecture notes |

The app is a static HTML/JavaScript SPA, not a React/Vite project. Some historical modules remain inline in `index.html`; the current application does not load standalone `forecast.js`, `cash-expense.js` or `overview-agent.js` files. All local scripts referenced by the current HTML are included. The earlier standalone versions and original fixtures are retained under `reference/earlier-project/`; deploy only `site/`.

## Current features

- Overview opens without metrics until Stable Business, Liquidity Risk or Growth Opportunity is selected.
- State buttons switch company datasets. They do not map state names to fixed skills.
- The existing deterministic orchestrator selects skills from financial records and intermediate results.
- Financial skill views, scenarios, Decision Synthesis, Configuration and CSV import are retained.
- Failure & Recovery Intelligence sits before Decision Synthesis. It compares an intentionally incorrect receipt-timing branch against a validated correction without overwriting shared company data.
- Scenario entry combines checking and running into one action; draft save/restore and undo remain available. Business type supports predefined choices and free text.

## Demo data

In Configuration → Data Hub → Import CSV, choose:

`demo-data/CashFlow_AI_Judges_Demo_2026-11-03.csv`

Review the preview and click **Use this dataset**. The fixture contains 90 days of simulated history and a 30-day forecast in SGD. Its forecast dates are November 4–December 3, 2026. Forecasts use the browser's current date, so regenerate the fixture for a later presentation.

```sh
npm run demo:generate -- 2026-11-03
```

You can supply a different as-of date in `YYYY-MM-DD` format. Generated files go into `demo-data/`. The included CSV remains the fixed original regression fixture.

## Checks and browser tests

The source and CSV checks require only Node:

```sh
npm run check
```

For browser tests and optional deployment tools:

```sh
npm install
npx playwright install chromium
npm test
```

The test runner launches a local server for each test and uses headless Chromium. To use an installed browser instead, set `BROWSER_EXECUTABLE_PATH` to its executable. Tests use synthetic QA profiles and do not include personal browser data. Browser tests were run on the exporting Windows machine using Microsoft Edge. Other platforms have not been independently tested.

## Deploy

Publish the contents of `site/` to any static host. For Cloudflare Pages, use no build command and set the output directory to `site` when deploying from the repository root.

For the existing Cloudflare project, an authorized account can run:

```sh
npm install
npx wrangler login
npm run deploy:preview
```

This targets a **preview branch**, `codex-github-export`, on `sme-cashflow-ai`. Change the project name in `package.json` when using another account/project. No Cloudflare credentials are included.

For GitHub Pages, publish `site/` as the site root using your chosen Pages configuration. Routing is hash-based (`#overview`, `#agent`, etc.). This archive does not configure or publish a GitHub repository automatically.

## GitHub upload

Extract the ZIP and upload the **contents of this folder** to a new repository, so `README.md`, `package.json` and `site/` are at the repository root. Alternatively, from this folder:

```sh
git init
git add .
git commit -m "Add CashFlow AI prototype"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

No license has been selected on your behalf. Add a license if you want to grant others reuse rights.

## Prototype boundaries

- Analysis and orchestration are local deterministic calculations, not a connected LLM.
- Authentication and saved drafts/models use browser storage, not server-side identity or cross-device sync.
- Planned banking/accounting/POS integrations are labels, not live connections.
- Approval controls do not execute external payments, applications or business actions.
- Google Fonts is requested from the network; fallback fonts remain available.
- Browser storage and credentials are not included in the archive. The ZIP also excludes `node_modules`, `.git`, Wrangler caches and temporary screenshots.

`docs/ORIGINAL-HANDOFF.md` is historical context. Its unfinished Overview notes and `outputs/` paths predate the completed work in this chat. Refer to this README and `docs/CURRENT-HANDOFF.md` for the exported version.

## Combined export

The full earlier-chat source is preserved in `reference/earlier-project/`. Use `site/` for the current app. See `docs/MERGE-REPORT.md` for resolved overlaps. Regenerate the three import-ready state fixtures with `npm run demo:states -- 2026-11-03`. The root `UPLOAD-TO-GITHUB.txt` gives the replacement upload steps in Chinese.
