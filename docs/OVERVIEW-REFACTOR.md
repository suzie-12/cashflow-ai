Overview button-first demo

Source snapshot: https://f589ace4.sme-cashflow-ai.pages.dev/
Updated preview: https://ffa9deaf.sme-cashflow-ai.pages.dev/#overview
Preview branch: codex-overview-button-first (production remains on main).

The static application is in site/. Overview starts with a null
currentBusinessState on every page load, regardless of browser storage.
Its three buttons generate predefined company datasets using the existing
generator. The shared businessData points to the same active object.
renderOverview(currentBusinessState) is the sole Overview renderer.
Legacy Overview HTML values, chart rendering, assessment rendering and
default switch mounting were removed from the original inline scripts.

dynamic-skill-orchestration.js is unchanged. Overview passes company data
to its existing evaluateDsoScenario and simulateDsoOrchestration functions.
These are the existing deterministic prototype, not a connected LLM.
No state-label-to-skill mapping is introduced.

demo-dataset.js also guards an existing call to a missing install export.
This prevents its original initialization exception without activating
otherwise dormant installation logic on other pages.

Browser checks: node verify-overview.cjs (uses local Playwright and Edge).
Passed: empty initial state, all three switches, shared object identity,
rapid switching, reset after reload, mobile layout inspection, navigation
to all existing routes, and zero JavaScript runtime errors.
Changing the financial conditions within the Stable dataset changes the
selected skills. Changing labels while keeping financial records fixed
does not change the selected skills.
