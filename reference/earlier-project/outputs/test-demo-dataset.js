'use strict';

// Node-only regression checks for the simulated dataset and the site's DSO rules.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generate, exportRows, toCsv, dataDictionary } = require('./demo-dataset.js');

const asOf = '2026-11-02';
const dsoSource = fs.readFileSync(require.resolve('./dynamic-skill-orchestration.js'), 'utf8');
function extractFunction(name) {
  const start = dsoSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `DSO function ${name} exists`);
  const open = dsoSource.indexOf('){', start) + 1;
  let depth = 0, quote = '', escaped = false;
  for (let i = open; i < dsoSource.length; i++) {
    const c = dsoSource[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return dsoSource.slice(start, i + 1);
  }
  throw new Error(`Could not extract ${name}`);
}
const diff = (date, now) => Math.round((new Date(`${date}T00:00:00`) - now) / 86400000);
const CASH = new Set(['receipt', 'expense', 'supplier', 'inventory']);
const OUT = new Set(['expense', 'supplier', 'inventory']);
const dso = Function('window', 'CASH', 'OUT', 'diff', 'today',
  `${extractFunction('model')}\n${extractFunction('group')}\n${extractFunction('choose')}\nreturn { model, choose };`)(
  { businessData: {} }, CASH, OUT, diff, () => new Date(`${asOf}T00:00:00`)
);

const outcomes = {};
for (const condition of ['stable', 'risk', 'growth']) {
  const data = generate(condition, { today: asOf });
  const b = data.businessData;
  const exportData = exportRows(data);
  assert.equal(b.companyName, 'ABC Lifestyle Store');
  assert.equal(b.currency, 'SGD');
  assert.equal(b.demoProfile.historicalStart, '2026-08-05');
  assert.equal(b.demoProfile.historicalEnd, asOf);
  assert.equal(b.demoProfile.forecastEnd, '2026-12-02');
  const rowFamilies = new Set(exportData.map(row => row.dataset));
  for (const family of ['sales', 'cash_inflow', 'expense_cash_outflow', 'accounts_receivable', 'accounts_payable', 'daily_inventory', 'daily_cash_balance', 'daily_business_performance', 'simulated_market_observation', 'business_profile']) assert.ok(rowFamilies.has(family), `${condition}: export includes ${family}`);

  const historicCash = b.records
    .filter(r => CASH.has(r.type) && r.date <= asOf && r.recordClass !== 'forecast')
    .reduce((sum, r) => sum + (r.type === 'receipt' ? +r.amount : -r.amount), b.openingCash);
  assert.ok(Math.abs(historicCash - b.cash) < 0.02, `${condition}: historical cash ledger reconciles`);

  const sales = data.salesTransactions.filter(r => r.recordType === 'sale').reduce((sum, r) => sum + r.amount, 0);
  const actualCollections = data.cashInflows.filter(r => r.recordClass === 'actual').reduce((sum, r) => sum + r.amount, 0);
  const openAr = data.accountsReceivable.reduce((sum, r) => sum + r.outstandingAmount, 0);
  assert.ok(Math.abs(sales - actualCollections - openAr) < 0.02, `${condition}: sales reconcile to collections plus receivables`);

  const badInventoryDays = data.inventoryDaily.filter(r => Math.abs(r.openingUnits + r.replenishmentUnits - r.unitsSold - r.closingUnits) > 0.001);
  assert.equal(badInventoryDays.length, 0, `${condition}: inventory roll-forward reconciles`);

  const model = dso.model(b, new Date(`${asOf}T00:00:00`));
  const skills = dso.choose(model).map(s => s.name);
  outcomes[condition] = { liquidity: model.liquidity, min: model.min, safe: model.safe, breachDay: model.breach, skills };
  assert.ok(skills.includes('Cash Flow Forecasting'), `${condition}: dated cash flow triggers forecast skill`);
}

assert.equal(outcomes.stable.liquidity, 'Stable');
assert.equal(outcomes.risk.liquidity, 'High Risk');
assert.equal(outcomes.growth.liquidity, 'High Risk');
assert.notDeepEqual(outcomes.stable.skills, outcomes.risk.skills, 'stable and risk conditions select different skills');
assert.notDeepEqual(outcomes.risk.skills, outcomes.growth.skills, 'risk and growth conditions select different skills');
assert.ok(!outcomes.stable.skills.includes('Market & Growth Intelligence'), 'stable early-month data does not trigger growth on an insufficient comparison window');
assert.ok(outcomes.growth.skills.includes('Market & Growth Intelligence'), 'growth evidence selects market and growth intelligence');
assert.ok(outcomes.stable.min > outcomes.stable.safe, 'stable condition stays above the reserve');
assert.ok(outcomes.risk.min < outcomes.risk.safe, 'risk condition breaches the reserve');
assert.ok(outcomes.growth.min < outcomes.growth.safe, 'growth condition exposes cash pressure');

const csv = toCsv([{ value: 'a,b', amount: 12 }]);
assert.match(csv, /"a,b"/);
assert.match(dataDictionary(), /90 days/);
assert.match(dataDictionary(), /daily_inventory/);
console.log(JSON.stringify({ passed: true, scenarios: outcomes, csvExport: 'passed', dataDictionary: 'passed' }, null, 2));
