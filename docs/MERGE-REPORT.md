# Combined source report

## Inputs

- Latest application from this chat: the `site/` files underlying deployment `6ce8850e`.
- Earlier chat archive supplied by the user: `CashFlowAI_GitHub_Source_2026-11-03.zip` and its `PROJECT_HANDOFF.md`.
- Source inspection of the supplied earlier `outputs/` directory.

## Result

`site/` is the single current application entry point. All latest UI work remains: blank initial Overview, data-driven orchestration, Failure & Recovery Intelligence, simplified scenario input, selectable/custom business types and darker sidebar branding.

The earlier archive is also preserved in full under `reference/earlier-project/`. Its standalone `overview-agent.js`, `cash-expense.js`, `forecast.js`, `enhancements.js`, fragment, generation/test scripts, data dictionary and original three CSV fixtures are included as historical source. They are not additionally loaded by the current application, which already retains legacy inline implementations. Loading both would duplicate initialization and risk replacing the current pages.

## Runtime merge

The earlier DSO runner's immutable input snapshot, per-run task list, run/fingerprint cancellation checks, completion event and guarded error reporting are integrated into the current DSO file. Its completion event reads the company condition from the model's `d` field. Current routing and the corrected market-KPI initialization order remain intact.

Overview analysis starts on the next event-loop turn, after the existing shared-data renderer's scheduled invalidation. A captured active-object check suppresses obsolete queued starts when the presenter switches states quickly.

The dataset generation and CSV serialization code before `install()` is identical in both supplied implementations. The earlier installer/UI changes primarily concern the old default Overview, selected-state snapshot and delegated legacy state buttons. Those conflicting UI layers are preserved as reference rather than activated over the new single-renderer Overview. This also retains the blank initial state.

The earlier `demo-i18n.js` additions label its old demo panels. They remain in the historical source. The current language files remain active so existing page wording is not replaced by obsolete panel content.

## Data

- The judges' November 3 CSV remains in `demo-data/`.
- Three additional November 3 state fixtures are regenerated from the current shared generator and validated through the actual importer.
- The original earlier-chat fixtures are retained unchanged under `reference/earlier-project/outputs/demo-data/`.
- The growth inventory deposit is explicitly included in regenerated cash-event exports so imported data matches the generated company records.

All of these are simulated data. Forecast dates are fixed, and a later presentation requires date-appropriate fixtures.

## Exclusions and deployment

The archive does not include `.wrangler`, `.xdg`, `work/`, `node_modules`, Git metadata, personal storage or credentials. Historical source is archived from the supplied clean ZIP, not from cache directories. This combined source has not been automatically deployed or pushed to GitHub.

Deploy `site/` only. Follow the root README for local startup, testing and preview deployment. The reference project is historical context and may retain older behavior or bugs.

## Verification performed

The combined package passed its source/asset/CSV checks and all four bundled browser suites on Windows using Microsoft Edge. The Overview suite also checks that the final selected state emits a successful analysis completion and no obsolete state completes after rapid switching. Recovery success/blocked cases, scenario input/draft operations and actual CSV import all passed with zero observed JavaScript runtime errors. The three regenerated state fixtures passed the native importer without errors, warnings or skipped records. Every file from the supplied clean earlier archive was retained byte-for-byte in the reference folder.
