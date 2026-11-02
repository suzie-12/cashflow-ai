const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

(async () => {
  const server = http.createServer((req, res) => {
    const name = req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0].slice(1);
    const file = path.join(__dirname, 'site', name);
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'text/html');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(4173, '127.0.0.1', r));
  const browser = await chromium.launch({ ...(process.env.BROWSER_EXECUTABLE_PATH ? {executablePath:process.env.BROWSER_EXECUTABLE_PATH} : {}), headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem('cashflow-local-accounts-v1', JSON.stringify({ 'qa@example.test': { email:'qa@example.test',fullName:'QA User',initials:'QA' } }));
      sessionStorage.setItem('cashflow-auth-email', 'qa@example.test');
    });
    await page.goto('http://127.0.0.1:4173/#overview');
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => currentBusinessState), null);
    assert.equal(await page.locator('#overview .metric').count(), 0);
    assert.equal(await page.locator('#overview svg').count(), 0);
    assert.equal(await page.locator('#overview button[aria-pressed="true"]').count(), 0);
    await page.screenshot({path:'overview-initial.png',fullPage:true});
    const outcomes = {};
    for (const key of ['stable','risk','growth','stable']) {
      await page.evaluate(key => setBusinessState(key), key);
      await page.waitForTimeout(250);
      const result = await page.evaluate(() => ({condition:currentBusinessState.condition,same:businessData===currentBusinessState,cash:currentBusinessState.cash,metrics:document.querySelectorAll('#overview .metric').length,skills:simulateDsoOrchestration(currentBusinessState).skills.map(s=>s.name)}));
      assert.equal(result.condition,key);
      assert.equal(result.same,true);
      assert.equal(result.metrics,5);
      outcomes[key] = result;
    }
    const dynamic = await page.evaluate(() => {
      const baseline = CashFlowDemoData.generate('stable', {today:currentBusinessState.asOfDate}).businessData;
      const changed = structuredClone(baseline);
      changed.cash = 1;
      changed.records.push({ date:baseline.asOfDate,type:'overdue_receivable',description:'Uncollected invoice',amount:20000 });
      const names = d => simulateDsoOrchestration(d).skills.map(s=>s.name);
      const renamed = structuredClone(changed); renamed.condition = 'growth'; renamed.conditionLabel = 'Arbitrary label';
      return {before:names(baseline),after:names(changed),renamed:names(renamed)};
    });
    assert.notDeepEqual(dynamic.before,dynamic.after);
    assert.deepEqual(dynamic.after,dynamic.renamed);
    await page.evaluate(() => {window.__mergeRuns=[];window.addEventListener('dso-analysis-complete',event=>window.__mergeRuns.push(event.detail));setBusinessState('risk');setBusinessState('growth');setBusinessState('stable')});
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(()=>currentBusinessState.condition),'stable');
    const runs=await page.evaluate(()=>window.__mergeRuns);assert(runs.length>0,'Final state analysis must complete');assert(runs.every(r=>r.condition==='stable'&&r.status!=='error'),'No obsolete state may complete');
    await page.screenshot({path:'overview-selected.png',fullPage:true});
    await page.reload(); await page.waitForTimeout(1000);
    assert.equal(await page.evaluate(()=>currentBusinessState),null);
    assert.equal(await page.locator('#overview .metric').count(),0);
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'overview-mobile.png',fullPage:true});
    for(const route of ['agent','dso-cash','dso-risk','dso-market','dso-decision','dso-scenario','reassess','configuration','overview']) {
      await page.evaluate(route=>go(route),route);
      await page.waitForTimeout(50);
      assert.equal(await page.locator('#'+route).count(),1);
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,outcomes,dynamic,errors},null,2));
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
