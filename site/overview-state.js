(function () {
  'use strict';

  // The only active Overview dataset. Never restored from storage on page load.
  let currentBusinessState = null;
  const states = { stable: 'Stable Business', risk: 'Liquidity Risk', growth: 'Growth Opportunity' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (value, data) => new Intl.NumberFormat('en-SG', { style: 'currency', currency: data.currency, maximumFractionDigits: 0 }).format(value);
  const day = (date, asOf) => Math.round((new Date(date + 'T12:00:00') - new Date(asOf + 'T12:00:00')) / 86400000);

  function renderOverview(currentBusinessState) {
    const el = document.getElementById('overview');
    if (!el) return;
    const data = currentBusinessState;
    const heading = `<div class="heading"><div><div class="eyebrow">BUSINESS STATE DEMO</div><h1>Cash overview</h1><p>Choose a business state to explore the company data.</p></div><span class="tag">SIMULATED DEMO DATA</span></div>`;
    const controls = `<div class="demo-switch" role="group" aria-label="Choose a Business State"><div class="demo-switch-copy"><b>Business State</b><small>Choose company data. Skills are selected from business evidence.</small></div>${Object.entries(states).map(([key, label]) => `<button type="button" class="demo-condition ${data?.condition === key ? 'active' : ''}" aria-pressed="${data?.condition === key}" onclick="setBusinessState('${key}')">${label}</button>`).join('')}</div>`;
    if (!data) {
      el.innerHTML = heading + controls + `<div class="card overview-empty"><div class="orb">◫</div><h2>Select a Business State to begin</h2><p>Your Overview will appear after you choose a dataset.</p></div>`;
      return;
    }

    // Reuse the existing adaptive orchestrator, passing data only. Button names
    // and labels are never used to choose, filter or dispatch skills.
    const assessment = window.evaluateDsoScenario(data);
    const workflow = window.simulateDsoOrchestration(data);
    const forecast = assessment.forecast;
    const cashTypes = new Set(['receipt', 'expense', 'supplier', 'inventory']);
    const dated = data.records.filter(r => cashTypes.has(r.type) && day(r.date, data.asOfDate) >= 0 && day(r.date, data.asOfDate) <= data.period);
    const incoming = dated.filter(r => r.type === 'receipt').reduce((a, r) => a + r.amount * (1 + (+data.salesGrowth || 0) / 100), 0);
    const outgoing = dated.filter(r => r.type !== 'receipt').reduce((a, r) => a + r.amount * (1 + (+data.cost || 0) / 100), 0);
    const reserve = Math.ceil(outgoing * 1.1);
    const gap = Math.max(0, data.safe - forecast.minimum);
    const risk = assessment.dimensions.liquidity;
    const path = Array(data.period + 1).fill(data.cash);
    dated.forEach(r => {
      const receipt = r.type === 'receipt';
      const timing = Math.min(data.period, day(r.date, data.asOfDate) + (receipt ? (+data.delay || 0) : 0));
      const impact = (receipt ? 1 : -1) * r.amount * (1 + (receipt ? (+data.salesGrowth || 0) : (+data.cost || 0)) / 100);
      for (let i = Math.max(1, timing); i <= data.period; i++) path[i] += impact;
    });
    const low = Math.min(...path, data.safe), high = Math.max(...path, data.safe), span = high - low || 1;
    const y = v => 190 - (v - low) / span * 150;
    const chart = `<svg viewBox="0 0 800 240" role="img" aria-label="Projected cash balance and configured reserve"><text x="12" y="18" class="axis">${esc(money(high, data))}</text><text x="12" y="209" class="axis">${esc(money(low, data))}</text><line x1="85" y1="${y(data.safe)}" x2="775" y2="${y(data.safe)}" class="safe"/><polyline fill="none" stroke="#254d70" stroke-width="3" points="${path.map((v, i) => `${85 + i / data.period * 690},${y(v)}`).join(' ')}"/>${[0, 10, 20, 30].filter(i => i <= data.period).map(i => `<text x="${85 + i / data.period * 690}" y="232" class="axis" text-anchor="middle">Day ${i}</text>`).join('')}</svg>`;
    const metric = (label, value, note, tone = '') => `<article class="card metric"><label>${label}</label><strong class="${tone}">${esc(value)}</strong><small>${esc(note)}</small></article>`;
    const dimensions = Object.entries(assessment.dimensions).map(([key, value]) => `<div class="fact"><span>${esc(({liquidity:'Liquidity', financialPerformance:'Financial performance', growth:'Growth signal', operationalRisk:'Operational risk', dataConfidence:'Data confidence'})[key])}</span><b>${esc(value)}</b></div>`).join('');
    const groups = [...new Set(workflow.skills.map(s => s.group))];
    el.innerHTML = heading + controls + `<div class="overview-source"><b>${esc(data.companyName)}</b> · ${esc(states[data.condition] || 'Updated company data')} · As of ${esc(data.asOfDate)} · ${data.records.length.toLocaleString()} records</div>
      <div class="grid metrics" id="overview-metrics">
        ${metric('Current cash', money(data.cash, data), 'Selected company dataset')}
        ${metric(data.period + '-day minimum cash', money(forecast.minimum, data), 'Minimum of the dated forecast', gap ? 'red' : 'green')}
        ${metric('Suggested monthly reserve', money(reserve, data), 'Scheduled outflows × 1.10 · rule estimate')}
        ${metric('Liquidity status', risk, 'Configured reserve ' + money(data.safe, data), gap ? 'red' : 'green')}
        ${metric('Next action', gap ? 'Verify cash timing' : 'Monitor business signals', gap ? 'Reserve shortfall ' + money(gap, data) : 'Reassess as evidence changes')}
      </div>
      <div class="grid cols"><article class="card"><div class="title"><div><h2>Cash-flow forecast</h2><p>Selected dataset and its recorded assumptions</p></div><button class="btn" onclick="go('dso-cash')">View Cash Flow →</button></div><div class="chart">${chart}</div><div class="legend">Blue: projected balance · Gold: configured reserve</div></article>
      <article class="card"><div class="title"><h2>Business health &amp; opportunity</h2></div><div class="facts">${dimensions}</div></article></div>
      <div class="grid lower"><article class="card"><div class="title"><div><h2>Dynamic Skill Orchestration</h2><p>Reassessed from company records · existing deterministic prototype</p></div></div><div class="summary"><div class="orb">✳</div><div><b>${groups.length} relevant Skill Groups</b><p>${esc(groups.join(' · '))}</p></div></div><div class="overview-skills">${workflow.skills.map(s => `<div class="action"><span><b>${esc(s.name)}</b><small>${esc(s.finding)}</small></span><span class="pill">${esc(s.status)}</span></div>`).join('')}</div><button class="btn primary" onclick="go('agent')">View dynamic skill workflow →</button></article>
      <article class="card"><div class="title"><h2>Forecast cash movements · ${data.period} days</h2></div><div class="action"><span>Expected inflows</span><b class="in">+${esc(money(incoming, data))}</b></div><div class="action"><span>Scheduled outflows</span><b class="out">−${esc(money(outgoing, data))}</b></div><div class="action"><span>Net change</span><b>${esc(money(incoming - outgoing, data))}</b></div><div class="action"><span>Projected ending cash</span><b>${esc(money(forecast.ending, data))}</b></div><p>${gap ? 'Verify receipt commitments and payment dates before comparing interventions.' : 'Review changes in sales, costs and collection timing as new records arrive.'}</p><button class="btn" onclick="go('reassess')">View Decision Synthesis →</button></article></div>
      <div class="footnote">Simulated company data · existing rule-based orchestration · human review required</div>`;
  }

  function setBusinessState(key) {
    if (!Object.hasOwn(states, key)) return;
    const now = new Date();
    const asOf = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const company = window.CashFlowDemoData.generate(key, { today: asOf });
    currentBusinessState = company.businessData;
    // Publish the same object to existing pages; no second active data copy.
    window.businessData = currentBusinessState;
    window.demoCompanyData = company;
    window.__cashFlowDemoScenarioActive = true;
    renderOverview(currentBusinessState);
    window.updateDemoPages?.();
    const selectedData = currentBusinessState;
    setTimeout(() => { if (currentBusinessState === selectedData) window.runDsoAnalysis?.(); }, 0);
    window.dispatchEvent(new CustomEvent('business-data-updated', { detail: { source: currentBusinessState.source } }));
  }

  window.renderOverview = renderOverview;
  window.setBusinessState = setBusinessState;
  window.addEventListener('business-data-updated', () => {
    if (currentBusinessState && window.businessData !== currentBusinessState) {
      currentBusinessState = window.businessData;
      renderOverview(currentBusinessState);
    }
  });
  Object.defineProperty(window, 'currentBusinessState', { get: () => currentBusinessState });
  const style = document.createElement('style');
  style.textContent = '#overview .demo-switch{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:20px;border:1px solid #e1e8ec;border-radius:11px;background:white;margin:16px 0}#overview .demo-switch-copy{grid-column:1/-1;display:grid;gap:5px;margin-bottom:4px}#overview .demo-switch-copy b{font-size:15px;color:#173b51}#overview .demo-switch-copy small{font-size:11px;color:#738596}#overview .demo-condition{min-height:62px;border:1px solid #d2e0e6;border-radius:8px;background:#f7fafb;color:#284a60;font-size:14px;font-weight:650;padding:12px;transition:background .15s,border-color .15s}#overview .demo-condition:hover{background:#eef7f7;border-color:#6daab3}#overview .demo-condition.active{background:#17657a;border-color:#17657a;color:white;box-shadow:0 3px 9px #17657a20}#overview .overview-empty{min-height:310px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;margin-top:18px}#overview .overview-empty h2{font-size:20px;margin:15px 0 4px}#overview .overview-empty p{color:var(--muted)}#overview .overview-source{color:var(--muted);font-size:11px;margin:14px 0}#overview .overview-skills{margin:12px 0}#overview .overview-skills .action{gap:12px}#overview .overview-skills small{max-width:620px;line-height:1.6}#overview .metric strong{font-size:20px}#overview .metric:last-child strong{font-size:15px}#overview button:focus-visible{outline:3px solid #48a9bc;outline-offset:3px}@media(max-width:640px){#overview .demo-switch{grid-template-columns:1fr;padding:16px;gap:9px}#overview .demo-condition{min-height:52px}#overview .overview-empty{min-height:220px}#overview .overview-empty h2{font-size:17px}}';
  document.head.appendChild(style);
  renderOverview(currentBusinessState);
})();
