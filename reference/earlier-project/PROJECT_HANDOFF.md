# Project Handoff

## 1. Project Overview

CashFlow AI is an AI-powered SME cash-flow management and business decision-support prototype. It is intended for SME owners and finance/operations leads who need to understand liquidity, risks, growth options, and possible next actions from business data. The site demonstrates shared financial data, cash-flow forecasting, risk/opportunity analysis, adaptive skill orchestration, scenario analysis, and human-reviewed recommendations.

## 2. Existing Website Architecture

- **Pages:** Overview; Dynamic Skill Orchestration; Cash Flow Intelligence; Financial & Operational Risk Intelligence; Market & Growth Intelligence; Financing Decision Intelligence; Scenario Analysis; Decision Synthesis; Configuration/Data Hub. The app also retains older Forecast, Cash Flow, Expenses, and AI Agent markup/rendering in the SPA shell; inspect routing before changing or removing any of it.
- **Data path:** manual entry, locally parsed business CSV, market-data CSV, or a selected demo fixture feeds the browser-side shared model (`window.businessData`). Configuration shows data quality, preview, and connector status. Planned connectors are not live integrations.
- **Business State Assessment:** rule-based assessment of liquidity risk, financial performance, growth opportunity, operational risk/efficiency, and data confidence, based on available evidence. Actual inputs, forecast values, and illustrative assumptions should remain distinguishable.
- **Dynamic Skill Orchestration (DSO):** deterministic prototype logic assesses the current model, selects relevant skills from evidence and data availability, executes local analysis functions, reassesses results, and produces a synthesis. It is not connected to a live LLM.
- **Business Skill Groups:** Cash Flow Intelligence; Financial & Operational Risk Intelligence; Market & Growth Intelligence; Financing Decision Intelligence. Data & Business Memory is a foundational context layer. Scenario Analysis is a shared, conditional analytical layer (sensitivity analysis, scenario modeling/simulation/planning/comparison), not a fifth primary business group.
- **Decision Synthesis:** presents evidence, recommendations, and approval controls. Approval is a prototype UI state; it does not execute external business or financial actions.

## 3. Important Design Decisions

- Three demo states are defined: **Stable**, **Liquidity Risk**, and **Growth Opportunity**. Each has a distinct, fixed mock-company dataset.
- The intended initial Overview is blank until a state is selected.
- Selecting or switching a state should load that state’s dataset, reassess the business, and trigger DSO again.
- Skills must be selected dynamically from the current evidence, data availability, severity, and intermediate results. Do not hardwire a particular skill set to a state.
- Preserve existing pages and working functionality while implementing the state-selection behavior.

## 4. Current Development Progress

- The project already contains fixed demo datasets, a shared browser-side business model, state-selection controls, deterministic assessment/orchestration functions, and page refresh hooks.
- **Unfinished:** the source initializes the Growth demo on first load and immediately assesses it. Therefore the requested blank initial Overview is not implemented. Legacy Overview markup also contains fixed sample values that can conflict with the active shared model.
- **Known issue:** the user reports that the three state buttons on the public site are not reliably clickable and do not show the selected state’s data. The source includes delegated click handling and page-refresh calls, but the current public behavior has not been verified or diagnosed. Do not assume the handler is the cause.
- The UI has previously been reported as mixed Chinese/English, and navigation was reported as sluggish after language-system changes. These issues have not been profiled or fully verified against the current public build.
- Authentication is a local browser prototype, not server-side identity; account records do not sync across devices.
- No website code was changed and no tests or deployment were performed for this handoff request.

## 5. Code Information

Project source is under `outputs/`:

- `outputs/index.html` — SPA shell, login UI, navigation/page markup, legacy dashboard values, and script loading.
- `outputs/demo-dataset.js` — seeded demo datasets, shared model, validation/calculation helpers, state selection, and page refresh integration. Key entry points include `generate(condition, opts)`, `selectCondition(condition)`, `loadCompleteDemoDataset(key)`, `resetDemoDataset()`, and `runBusinessAnalysis()`.
- `outputs/dynamic-skill-orchestration.js` — DSO assessment, skill selection/execution, reassessment, and rendered orchestration views. Key functions include `evaluateDsoScenario`, `runDsoAnalysis`, and `simulateDsoOrchestration`.
- `outputs/demo-data/` — fixed `stable`, `risk`, and `growth` CSV fixture bundles and a data dictionary.
- Other page and support scripts include `outputs/overview-agent.js`, `outputs/forecast.js`, `outputs/cash-expense.js`, `outputs/decision-synthesis.js`, `outputs/market-data-import.js`, `outputs/demo-csv-import.js`, `outputs/auth-profile.js`, and the `outputs/*i18n*` / `outputs/workspace-language.js` files.

The demo model uses browser storage keys `sme-cashflow-model`, `sme-cashflow-demo-condition-v1`, and `sme-cashflow-demo-active-v1`; the workspace language uses `sme-workspace-language`. `demo-dataset.js` currently defaults `storedCondition` to `growth` and activates demo data on startup. DSO also assesses the initial model during startup. No files have been modified during the current handoff task; there are no unfinished edits from this task.

## 6. Next Development Task

Refactor Overview startup so it is blank until the user selects **Stable**, **Liquidity Risk**, or **Growth Opportunity**. After selection, load the matching fixed dataset and update all relevant metrics and pages, then run the complete evidence-based Business State Assessment and Dynamic Skill Orchestration workflow. Preserve dynamic skill selection and existing functionality. First trace startup initialization, state-button events, legacy hardcoded Overview values, and shared page refreshes; do not replace them with state-specific fixed skill lists.
