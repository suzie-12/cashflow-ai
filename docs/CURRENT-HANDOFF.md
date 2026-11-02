# Current handoff — November 3, 2026

The application source is in `site/`. It matches the latest published snapshot `6ce8850e`, including the darker CashFlow AI sidebar wordmark. The combined export additionally merges analysis snapshot/run protection and defers Overview analysis until pending dataset invalidations finish. These combined-source changes are not deployed. The original files from the other chat are retained under reference/earlier-project/. See MERGE-REPORT.md.

## Completed since the original handoff

1. Removed legacy Overview output and default metrics. `overview-state.js` owns `currentBusinessState` and `renderOverview(currentBusinessState)`. No Overview selection is restored at initial load.
2. Preserved adaptive skill selection from actual dataset evidence. State labels do not dispatch fixed skill sets.
3. Added Failure & Recovery Intelligence before Decision Synthesis, six linked categories, expandable findings, comparison, recovery status and history. Recovery shifts future receipt dates by 15 days, validates unchanged amounts/unrelated rows and recalculates with the existing engine. It reports blocked recovery when required data is absent.
4. Simplified the scenario modal to Check & Run Analysis, sample data and More options. Added field-specific validation, draft save/restore, undo, SGD support, larger sticky buttons and duplicate-click prevention. Quick mode edits upcoming cash events while preserving historical/financial records.
5. Added 20 selectable business types with editable/custom text.
6. Created and browser-tested the November 3 judges' CSV, including the growth inventory deposit omitted by the older exporter.
7. Darkened the sidebar CashFlow AI wordmark to `#17334a`.

## Compatibility fixes already applied

- Guarded the original missing `demo-dataset.js` install export to avoid initialization exceptions without activating dormant installer behavior.
- Moved the market KPI helper ahead of its first use; this fixes navigation when demo demand assumptions exist.
- Registered the recovery route in the earlier router as well as the current router so direct links work.

## Verification included

- Overview empty initial state, switches, shared object identity, rapid switching, refresh reset, overlapping skills, and data-sensitive rather than label-sensitive skill selection.
- Recovery routing/order, comparisons, successful and blocked cases, shared-data preservation, dataset refresh and mobile layout inspection.
- Scenario currency, validation and retry, drafts, undo, custom type selection, history preservation, analysis dispatch and keyboard dismissal.
- Actual CSV upload, preview, application and recovery against imported data.

No personal accounts, saved browser storage, Cloudflare tokens, Git remote credentials or local dependency directories are packaged. This is the current static frontend; no production backend or LLM service exists in the supplied application.
