(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CashFlowDemoData = api;
  if (typeof window !== 'undefined' && window.document) api.install(window);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CATEGORIES = [
    { category: 'Home Decor', sku: 'HD-101', product: 'Linen Cushion Set', price: 48, cost: 25, units: 10 },
    { category: 'Kitchenware', sku: 'KW-204', product: 'Ceramic Pour-over Set', price: 72, cost: 39, units: 5.25 },
    { category: 'Wellness', sku: 'WL-310', product: 'Aroma Diffuser', price: 86, cost: 45, units: 3.6 },
    { category: 'Accessories', sku: 'AC-415', product: 'Everyday Carry Tote', price: 38, cost: 18, units: 12 },
    { category: 'Home Decor', sku: 'HD-118', product: 'Table Lamp', price: 128, cost: 70, units: 1.8 }
  ];
  const CONDITIONS = {
    stable: { name: 'Stable Business', note: 'Steady sales, timely collections and a cash buffer above the calculated reserve.' },
    risk: { name: 'Increasing Liquidity Risk', note: 'Sales soften, collections slow and procurement costs rise while operating commitments remain.' },
    growth: { name: 'Growth Opportunity with Financial Pressure', note: 'Demand improves in Home Decor while inventory and marketing investment compress liquidity.' }
  };
  // Fixed as-of date keeps the three presenter datasets stable and repeatable.
  const DEFAULT_AS_OF = '2026-11-02';
  const STORAGE = { model: 'sme-cashflow-model', condition: 'sme-cashflow-demo-condition-v1', activeDemo: 'sme-cashflow-demo-active-v1' };
  const OPEX = [
    { category: 'Rent', amount: 6200, cadence: 30, day: 2, desc: 'Retail and storage rent' },
    { category: 'Payroll', amount: 15800, cadence: 30, day: 25, desc: 'Monthly payroll' },
    { category: 'Marketing', amount: 1900, cadence: 14, day: 5, desc: 'Digital campaign spend' },
    { category: 'Utilities', amount: 1150, cadence: 30, day: 9, desc: 'Utilities and connectivity' },
    { category: 'Logistics', amount: 1450, cadence: 7, day: 4, desc: 'Delivery and fulfilment' },
    { category: 'Platform Fees', amount: 980, cadence: 7, day: 6, desc: 'Marketplace and payment fees' },
    { category: 'Other Operating', amount: 620, cadence: 10, day: 7, desc: 'Store supplies and services' }
  ];
  const pad = n => String(n).padStart(2, '0');
  const dateString = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (date, n) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return dateString(d); };
  const dayDiff = (a, b) => Math.round((new Date(`${a}T12:00:00`) - new Date(`${b}T12:00:00`)) / 86400000);
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  const unitRand = s => (hash(s) % 10000) / 10000;
  const round2 = n => Math.round(n * 100) / 100;
  const money = n => round2(n);
  const id = (prefix, key) => `${prefix}-${hash(key).toString(36).toUpperCase().padStart(7, '0')}`;

  function generate(condition = 'growth', opts = {}) {
    if (!CONDITIONS[condition]) throw new Error(`Unknown demo condition: ${condition}`);
    const today = opts.today ? dateString(new Date(`${opts.today}T12:00:00`)) : DEFAULT_AS_OF;
    const start = addDays(today, -89);
    const asOf = today;
    const end = addDays(today, 30);
    const phaseAt = i => {
      if (condition === 'stable') return 'stable';
      if (condition === 'risk') return i >= 60 ? 'risk' : 'stable';
      if (i >= 75) return 'growth';
      return i >= 55 ? 'risk' : 'stable';
    };
    const orders = [], cashInflows = [], expenseRows = [], procurementRows = [], inventoryRows = [], receivables = [], payables = [], performance = [], marketData = [], cashRecords = [], financialRecords = [];
    const inventory = Object.fromEntries(CATEGORIES.map(p => [p.sku, 55 + Math.floor(unitRand(p.sku) * 24)]));
    const openingInventory = { ...inventory };
    const receivableOpen = [];
    let openingCash = 100000;
    let cash = openingCash;
    const transactionByDate = new Map();
    const saleRowsByDay = [];
    const dateAt = i => addDays(start, i);
    const marketSource = 'SIMULATED DEMO ASSUMPTION · NOT EXTERNAL MARKET DATA';

    function eventRecord(date, type, description, amount, extra = {}) {
      const r = { date, type, description, amount: money(amount), sourceLabel: 'SIMULATED DEMO DATA', ...extra };
      cashRecords.push(r);
      return r;
    }
    function addSale(dayIndex, forecast = false) {
      const date = forecast ? addDays(asOf, dayIndex) : dateAt(dayIndex);
      const phaseIndex = forecast ? 89 + dayIndex : dayIndex;
      const phase = forecast ? (condition === 'growth' ? 'growth' : condition === 'risk' ? 'risk' : 'stable') : phaseAt(dayIndex);
      const weekend = [0, 6].includes(new Date(`${date}T12:00:00`).getDay()) ? 1.16 : 1;
      const rows = [];
      for (const p of CATEGORIES) {
        let growthFactor = phase === 'growth' && p.category === 'Home Decor' ? 1.28 : 1;
        let demandFactor = phase === 'risk' ? 0.9 : 1;
        // Keep the stable phase genuinely steady; weekend variation remains visible.
        let seasonal = 0.97 + unitRand(`${date}|${p.sku}|sales`) * 0.06;
        let quantity = Math.max(1, Math.round(p.units * weekend * growthFactor * demandFactor * seasonal));
        let unitPrice = p.price;
        if (phase === 'growth' && p.category === 'Home Decor') quantity += 1;
        const gross = money(quantity * unitPrice);
        const orderId = id(forecast ? 'F' : 'SO', `${condition}|${date}|${p.sku}`);
        const delayed = unitRand(`${orderId}|terms`) < (phase === 'risk' ? 0.38 : 0.24);
        const dueDate = delayed ? addDays(date, 14) : date;
        const delayExtra = phase === 'risk' ? 14 : phase === 'growth' ? 7 : 0;
        const plannedCollection = delayed ? addDays(dueDate, delayExtra) : date;
        const collected = plannedCollection <= asOf && !forecast;
        const paymentStatus = forecast ? (delayed ? 'Forecast · invoice' : 'Forecast · immediate') : collected ? (delayed ? 'Paid · delayed collection' : 'Paid') : 'Outstanding';
        const order = {
          transactionId: orderId, date, recordType: forecast ? 'forecast_sale' : 'sale', category: p.category,
          productName: p.product, sku: p.sku, quantity, unitSellingPrice: unitPrice, amount: gross,
          paymentMethod: delayed ? 'Invoice / bank transfer' : (unitRand(`${orderId}|method`) < 0.53 ? 'Card / online' : 'Cash / in-store'),
          paymentStatus, customerId: `C-${String(1 + (hash(orderId) % 38)).padStart(3, '0')}`,
          invoiceDate: delayed ? date : '', dueDate: delayed ? dueDate : '',
          paymentDate: collected ? plannedCollection : forecast ? plannedCollection : '',
          expectedPaymentDate: plannedCollection, phase, dataStatus: forecast ? 'Forecast assumption' : 'Simulated actual'
        };
        orders.push(order); rows.push(order);
        if (forecast) {
          const collectionDate = plannedCollection < addDays(asOf, 1) ? addDays(asOf, 1) : plannedCollection;
          const receipt = { ...eventRecord(collectionDate, 'receipt', `Forecast collection · ${p.product}`, gross, { transactionId: orderId, category: p.category, recordClass: 'forecast', paymentStatus, expectedPaymentDate: collectionDate }), recordType: 'forecast_collection' };
          cashInflows.push(receipt);
          continue;
        }
        financialRecords.push({ date, type: 'revenue', description: `${p.product} sales`, amount: gross, category: p.category, productName: p.product, sku: p.sku, quantity, transactionId: orderId, recordClass: 'actual', sourceLabel: 'SIMULATED DEMO DATA' });
        const cogs = money(quantity * p.cost * (phase === 'risk' || phase === 'growth' ? 1.05 : 1));
        financialRecords.push({ date, type: 'cogs', description: `Cost of goods sold · ${p.product}`, amount: cogs, category: p.category, productName: p.product, sku: p.sku, quantity, transactionId: orderId, recordClass: 'actual', sourceLabel: 'SIMULATED DEMO DATA' });
        if (delayed && !collected) {
          const open = { invoiceId: `AR-${orderId}`, customerId: order.customerId, customerName: `Retail Customer ${String(1 + (hash(orderId) % 38)).padStart(3, '0')}`, invoiceDate: date, dueDate, expectedPaymentDate: plannedCollection, paymentDate: '', amount: gross, outstandingAmount: gross, status: dueDate < asOf ? 'Overdue' : 'Open', transactionId: orderId, sourceLabel: 'SIMULATED DEMO DATA' };
          receivables.push(open); receivableOpen.push(open);
          if (dueDate < asOf) financialRecords.push({ date: asOf, type: 'overdue_receivable', description: `Overdue customer invoice ${open.invoiceId}`, amount: gross, dueDate, transactionId: orderId, sourceLabel: 'SIMULATED DEMO DATA' });
        } else {
          const receipt = { ...eventRecord(plannedCollection, 'receipt', `Customer collection · ${p.product}`, gross, { transactionId: orderId, category: p.category, recordClass: 'actual', paymentStatus, expectedPaymentDate: plannedCollection }), recordType: 'customer_collection' };
          cashInflows.push(receipt);
        }
        const stockBefore = inventory[p.sku];
        inventory[p.sku] = Math.max(0, stockBefore - quantity);
        rows[rows.length - 1].inventoryUnitsAfterSale = inventory[p.sku];
      }
      saleRowsByDay.push({ date, phase, rows });
      const revenue = rows.reduce((s, r) => s + r.amount, 0);
      performance.push({ date, phase, salesRevenue: money(revenue), unitsSold: rows.reduce((s, r) => s + r.quantity, 0), customerDemandIndex: Math.round(53 + unitRand(`${date}|demand`) * 11 + (phase === 'risk' ? -8 : phase === 'growth' ? 15 : 0)), marketingSpend: 0, recordClass: forecast ? 'forecast assumption' : 'simulated actual' });
      for (const category of [...new Set(CATEGORIES.map(p => p.category))]) {
        const c = rows.filter(r => r.category === category).reduce((s, r) => s + r.quantity, 0);
        marketData.push({ date, metric: 'customer_demand_index', value: Math.min(100, Math.max(0, Math.round(50 + c * 2 + (phase === 'growth' && category === 'Home Decor' ? 18 : 0)))), unit: 'index 0–100', source: marketSource, segment: category, recordClass: forecast ? 'simulated forecast assumption' : 'simulated internal demand proxy' });
      }
    }

    // Daily sales and replenishment are generated together so each SKU ledger reconciles.
    for (let i = 0; i < 90; i++) {
      const date = dateAt(i), phase = phaseAt(i), openingBySku = { ...inventory };
      addSale(i, false);
      const soldBySku = Object.fromEntries(CATEGORIES.map(p => [p.sku, saleRowsByDay[i].rows.filter(r => r.sku === p.sku).reduce((s, r) => s + r.quantity, 0)]));
      const replenished = Object.fromEntries(CATEGORIES.map(p => [p.sku, 0]));
      for (const p of CATEGORIES) {
        const stockAfterSales = inventory[p.sku];
        const dailyDemand = p.units * (phase === 'growth' && p.category === 'Home Decor' ? 1.28 : phase === 'risk' ? 0.9 : 1);
        const reorderPoint = Math.ceil(dailyDemand * 7 + 12);
        const target = Math.ceil(dailyDemand * 14 + 12);
        if (stockAfterSales > reorderPoint) continue;
        const units = Math.max(0, target - stockAfterSales);
        if (!units) continue;
        const costFactor = phase === 'stable' ? 1 : 1.05;
        const purchaseCost = money(units * p.cost * costFactor);
        const supplierInvoiceId = id('PO', `${condition}|${date}|${p.sku}`);
        const dueDate = addDays(date, 14);
        const paid = dueDate <= asOf;
        const growthInvestment = condition === 'growth' && phase === 'growth' && p.category === 'Home Decor';
        const ap = { invoiceId: `AP-${supplierInvoiceId}`, supplier: `Merlion ${p.category} Supply`, invoiceDate: date, dueDate, paymentDate: paid ? dueDate : '', amount: purchaseCost, outstandingAmount: paid ? 0 : purchaseCost, status: paid ? 'Paid' : 'Open', sku: p.sku, category: p.category, quantity: units, unitCost: money(p.cost * costFactor), paymentTermsDays: 14, purchaseOrderId: supplierInvoiceId, sourceLabel: 'SIMULATED DEMO DATA' };
        procurementRows.push({ date, purchaseOrderId: supplierInvoiceId, supplierInvoiceId: ap.invoiceId, supplier: ap.supplier, sku: p.sku, category: p.category, productName: p.product, quantity: units, unitCost: ap.unitCost, purchaseCost, paymentTermsDays: 14, dueDate, paymentDate: ap.paymentDate, status: ap.status, growthInvestment, sourceLabel: 'SIMULATED DEMO DATA' });
        payables.push(ap);
        inventory[p.sku] += units;
        replenished[p.sku] = units;
        if (dueDate <= asOf) {
          const out = eventRecord(dueDate, 'inventory', `Supplier payment · ${p.product}`, purchaseCost, { category: p.category, sku: p.sku, quantity: units, invoiceId: ap.invoiceId, recordClass: 'actual', dueDate });
          expenseRows.push({ ...out, expenseCategory: 'Inventory Purchases', paymentStatus: 'Paid', actualPaymentDate: dueDate, supplier: ap.supplier });
        } else if (dueDate <= end) {
          const out = eventRecord(dueDate, 'supplier', `Forecast · supplier invoice ${ap.invoiceId}`, purchaseCost, { category: p.category, sku: p.sku, quantity: units, invoiceId: ap.invoiceId, recordClass: 'forecast', paymentStatus: 'Forecast commitment', dueDate });
          expenseRows.push({ ...out, expenseCategory: 'Inventory Purchases', paymentStatus: 'Scheduled', actualPaymentDate: '' });
        }
      }
      for (const p of CATEGORIES) inventoryRows.push({ date, sku: p.sku, category: p.category, productName: p.product, openingUnits: openingBySku[p.sku], unitsSold: soldBySku[p.sku], replenishmentUnits: replenished[p.sku], purchaseCost: money(replenished[p.sku] * p.cost * (phase === 'stable' ? 1 : 1.05)), supplierPaymentTermsDays: 14, closingUnits: inventory[p.sku], sourceLabel: 'SIMULATED DEMO DATA' });
    }

    // Explicit growth launch investment makes the upside and liquidity trade-off visible.
    if (condition === 'growth') {
      const investmentDate = addDays(asOf, 3);
      const investment = eventRecord(investmentDate, 'supplier', 'Growth launch · advance inventory deposit', 18500, { category: 'Inventory Purchases', recordClass: 'forecast', paymentStatus: 'Scheduled', dueDate: investmentDate, sourceLabel: 'SIMULATED DEMO ASSUMPTION' });
      procurementRows.push({ date: investmentDate, purchaseOrderId: 'PO-GROWTH-ADVANCE', supplierInvoiceId: 'AP-GROWTH-ADVANCE', supplier: 'Merlion Home Decor Supply', sku: 'HD-101', category: 'Home Decor', productName: 'Growth launch inventory', quantity: 310, unitCost: 59.68, purchaseCost: 18500, paymentTermsDays: 0, dueDate: investmentDate, paymentDate: '', status: 'Forecast commitment', growthInvestment: true, sourceLabel: 'SIMULATED DEMO ASSUMPTION' });
      payables.push({ invoiceId: 'AP-GROWTH-ADVANCE', supplier: 'Merlion Home Decor Supply', invoiceDate: asOf, dueDate: investmentDate, paymentDate: '', amount: 18500, outstandingAmount: 18500, status: 'Forecast commitment', sku: 'HD-101', category: 'Home Decor', quantity: 310, unitCost: 59.68, paymentTermsDays: 0, sourceLabel: 'SIMULATED DEMO ASSUMPTION' });
    }

    // Add recurring operating payments and operating data; all payment dates are explicit.
    for (let i = 0; i < 90; i++) {
      const date = dateAt(i), phase = phaseAt(i);
      let dailyOperating = 0;
      for (const expense of OPEX) {
        if (i % expense.cadence !== expense.day % expense.cadence) continue;
        const growthUplift = phase === 'growth' && expense.category === 'Marketing' ? 2.1 : 1;
        const riskUplift = phase !== 'stable' ? (expense.category === 'Other Operating' ? 1.05 : 1) : 1;
        const amount = money(expense.amount * growthUplift * riskUplift * (0.96 + unitRand(`${date}|${expense.category}`) * 0.08));
        const row = eventRecord(date, 'expense', expense.desc, amount, { expenseCategory: expense.category, recordClass: 'actual', paymentStatus: 'Paid', actualPaymentDate: date });
        expenseRows.push(row);
        financialRecords.push({ date, type: 'opex', description: expense.desc, amount, category: expense.category, sourceLabel: 'SIMULATED DEMO DATA', recordClass: 'actual' });
        dailyOperating += amount;
      }
      const marketing = expenseRows.filter(r => r.date === date && r.expenseCategory === 'Marketing').reduce((s, r) => s + r.amount, 0);
      const perf = performance.find(r => r.date === date);
      if (perf) perf.marketingSpend = marketing;
    }

    // Forecast operational commitments through day 30 and forecast receivable collections.
    for (let d = 1; d <= 30; d++) {
      const date = addDays(asOf, d), phase = condition === 'growth' ? 'growth' : condition === 'risk' ? 'risk' : 'stable';
      const histIndex = 89;
      addSale(d, true);
      for (const expense of OPEX) {
        const futureDay = dayDiff(date, start);
        if (futureDay % expense.cadence !== expense.day % expense.cadence) continue;
        const factor = phase === 'growth' && expense.category === 'Marketing' ? 2.1 : 1;
        const amount = money(expense.amount * factor);
        const out = eventRecord(date, 'expense', `Forecast · ${expense.desc}`, amount, { expenseCategory: expense.category, recordClass: 'forecast', paymentStatus: 'Forecast', actualPaymentDate: '' });
        expenseRows.push(out);
      }
      // Forecast supplier purchases are recorded at the supplier payment date, not at sale date.
      if (d === 8 || d === 18 || d === 28) {
        const amount = condition === 'growth' && d === 8 ? 11200 : condition === 'risk' ? 8600 : 7600;
        const out = eventRecord(date, 'supplier', 'Forecast · scheduled supplier settlement', amount, { expenseCategory: 'Inventory Purchases', recordClass: 'forecast', paymentStatus: 'Forecast commitment', dueDate: date });
        expenseRows.push(out);
      }
      if (condition === 'growth' && d === 10) {
        const campaign = money(4200);
        const out = eventRecord(date, 'expense', 'Forecast · growth campaign launch', campaign, { expenseCategory: 'Marketing', recordClass: 'forecast', paymentStatus: 'Forecast assumption' });
        expenseRows.push(out);
      }
    }

    // Add inbound collection events from open invoices only when their expected date is inside horizon.
    for (const ar of receivables) {
      if (ar.expectedPaymentDate > asOf && ar.expectedPaymentDate <= end) {
        const due = eventRecord(ar.expectedPaymentDate, 'receipt', `Forecast collection · ${ar.invoiceId}`, ar.outstandingAmount, { transactionId: ar.transactionId, recordClass: 'forecast', paymentStatus: 'Expected collection', expectedPaymentDate: ar.expectedPaymentDate });
        cashInflows.push({ ...due, recordType: 'forecast_ar_collection' });
      }
    }

    // Determine cash as-of today from the same ledger's historical receipts and settled payments.
    const historicalCashEvents = cashRecords.filter(r => r.date <= asOf && r.recordClass !== 'forecast');
    cash = openingCash + historicalCashEvents.reduce((sum, r) => sum + (r.type === 'receipt' ? r.amount : -r.amount), 0);
    const last90 = cashRecords.filter(r => r.date <= asOf && r.recordClass !== 'forecast');
    const actualDates = Array.from({ length: 90 }, (_, i) => dateAt(i));
    const dailyCash = actualDates.map(date => {
      const dayEvents = last90.filter(r => r.date === date);
      const inflow = dayEvents.filter(r => r.type === 'receipt').reduce((s, r) => s + r.amount, 0);
      const outflow = dayEvents.filter(r => r.type !== 'receipt').reduce((s, r) => s + r.amount, 0);
      return { date, openingBalance: 0, cashInflows: money(inflow), cashOutflows: money(outflow), closingBalance: 0, sourceLabel: 'SIMULATED DEMO DATA' };
    });
    let running = openingCash;
    for (const row of dailyCash) { row.openingBalance = money(running); running = money(running + row.cashInflows - row.cashOutflows); row.closingBalance = running; }
    cash = running;
    const currentReceivables = receivables.filter(r => r.status !== 'Paid');
    const overdueAmount = currentReceivables.filter(r => r.status === 'Overdue').reduce((s, r) => s + r.outstandingAmount, 0);
    const monthlyEssentials = 6200 + 15800 + 1150 + 1450 + 980 + 620;
    const safe = money(monthlyEssentials * (condition === 'stable' ? 0.72 : 1.35));
    const salesGrowth = condition === 'growth' ? 8 : condition === 'risk' ? -10 : 0;
    const latestMonthly = performance.filter(r => r.recordClass === 'simulated actual').at(-1)?.salesRevenue || 0;
    const dateName = new Date(`${asOf}T12:00:00`).toLocaleDateString('en-SG', { dateStyle: 'medium' });
    const normalizedCash = cashRecords.map(r => ({ ...r }));
    const normalizedFinancial = financialRecords.map(r => ({ ...r }));
    const records = [...normalizedCash, ...normalizedFinancial].sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type) || String(a.description).localeCompare(String(b.description)));
    const businessData = {
      businessType: 'SME Retail · Online & Offline', companyName: 'ABC Lifestyle Store', currency: 'SGD',
      cash, openingCash, period: 30, safe, salesGrowth, delay: condition === 'risk' ? 14 : 0,
      cost: condition === 'stable' ? 0 : 5, source: 'simulated-demo', updated: dateName, asOfDate: asOf,
      condition, conditionLabel: CONDITIONS[condition].name, sourceLabel: 'SIMULATED DEMO DATA', records,
      // Generated market proxies are exported as assumptions, but are deliberately
      // excluded from marketData so the UI never presents them as imported evidence.
      marketData: [],
      demoProfile: { company: 'ABC Lifestyle Store', type: 'Small and Medium-sized Retail Business', currency: 'SGD', model: 'Online and offline retail', historicalStart: start, historicalEnd: asOf, forecastStart: addDays(asOf, 1), forecastEnd: end, openingCash, cash, safe, period: 30, salesGrowth, delay: condition === 'risk' ? 14 : 0, cost: condition === 'stable' ? 0 : 5, condition, conditionLabel: CONDITIONS[condition].name, conditionNote: CONDITIONS[condition].note, marketAssumptionsIncludedInExport: true, dataNature: 'SIMULATED DEMO DATA' }
    };
    // Daily inventory movement is reconciled from opening stock + receipts - sales.
    const dailyInventory = [];
    for (const p of CATEGORIES) {
      let level = openingInventory[p.sku];
      for (let i = 0; i < 90; i++) {
        const date = dateAt(i), sold = saleRowsByDay[i].rows.filter(r => r.sku === p.sku).reduce((s, r) => s + r.quantity, 0);
        const replenishment = procurementRows.filter(r => r.date === date && r.sku === p.sku).reduce((s, r) => s + r.quantity, 0);
        const openingUnits = level;
        level = Math.max(0, level + replenishment - sold);
        dailyInventory.push({ date, sku: p.sku, category: p.category, productName: p.product, openingUnits, unitsSold: sold, replenishmentUnits: replenishment, purchaseCost: money(replenishment * p.cost * (phaseAt(i) === 'stable' ? 1 : 1.05)), closingUnits: level, sourceLabel: 'SIMULATED DEMO DATA' });
      }
    }
    const scenario = {
      condition, conditionLabel: CONDITIONS[condition].name, conditionNote: CONDITIONS[condition].note,
      salesTransactions: orders, cashInflows, expenses: expenseRows, procurement: procurementRows,
      inventoryDaily: dailyInventory, accountsReceivable: receivables, accountsPayable: payables,
      dailyCash, dailyPerformance: performance, marketData: businessData.marketData, marketAssumptions: marketData, businessData
    };
    return scenario;
  }

  function toCsv(rows, columns) {
    const quote = v => { const x = v == null ? '' : Array.isArray(v) || (typeof v === 'object') ? JSON.stringify(v) : String(v); return /[",\r\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
    const keys = columns || [...new Set(rows.flatMap(r => Object.keys(r)))];
    return [keys.join(','), ...rows.map(r => keys.map(k => quote(r[k])).join(','))].join('\r\n');
  }
  function exportRows(d) {
    return [
      ...d.salesTransactions.map(r => ({ ...r, dataset: 'sales' })),
      ...d.cashInflows.map(r => ({ ...r, dataset: 'cash_inflow' })),
      ...d.expenses.map(r => ({ ...r, dataset: 'expense_cash_outflow' })),
      ...d.procurement.map(r => ({ ...r, dataset: 'inventory_procurement' })),
      ...d.accountsReceivable.map(r => ({ ...r, dataset: 'accounts_receivable' })),
      ...d.accountsPayable.map(r => ({ ...r, dataset: 'accounts_payable' })),
      ...d.inventoryDaily.map(r => ({ ...r, dataset: 'daily_inventory' })),
      ...d.dailyCash.map(r => ({ ...r, dataset: 'daily_cash_balance' })),
      ...d.dailyPerformance.map(r => ({ ...r, dataset: 'daily_business_performance' })),
      ...d.businessData.records.filter(r => ['revenue', 'cogs', 'opex', 'overdue_receivable'].includes(r.type)).map(r => ({ ...r, dataset: 'business_financial_record' })),
      ...(d.marketAssumptions || []).map(r => ({ ...r, dataset: 'simulated_market_observation' })),
      { ...d.businessData.demoProfile, dataset: 'business_profile', companyName: d.businessData.companyName, currency: d.businessData.currency }
    ];
  }
  function install(win) {
    if (win.__cashFlowDemoInstalled) return;
    const $ = s => win.document.querySelector(s);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const validCondition = key => Object.prototype.hasOwnProperty.call(CONDITIONS, key);
    const clone = value => JSON.parse(JSON.stringify(value));
    const generated = Object.fromEntries(Object.keys(CONDITIONS).map(key => [key, generate(key)]));
    const pristine = Object.fromEntries(Object.entries(generated).map(([key, value]) => [key, clone(value)]));
    let stored = null, storedCondition = 'growth', activeDemo = true;
    try {
      stored = JSON.parse(win.localStorage.getItem(STORAGE.model) || 'null');
      storedCondition = win.localStorage.getItem(STORAGE.condition) || 'growth';
      activeDemo = win.localStorage.getItem(STORAGE.activeDemo) !== 'false';
    } catch (_) {}
    if (!validCondition(storedCondition)) storedCondition = 'growth';
    win.demoCompanyData = clone(generated[storedCondition]);
    win.__cashFlowDemoScenarioActive = activeDemo && (!stored || stored.source === 'simulated-demo');
    win.__cashFlowDemoSelectionId = Number.isInteger(win.__cashFlowDemoSelectionId) ? win.__cashFlowDemoSelectionId : 0;
    // The active preset is the source of truth. Older persisted simulated
    // records could otherwise override the newly selected scenario on load.
    win.businessData = win.__cashFlowDemoScenarioActive
      ? clone(win.demoCompanyData.businessData)
      : (stored && stored.records ? stored : clone(win.demoCompanyData.businessData));
    function refresh() {
      if (win.__cashFlowDemoScenarioActive) win.businessData = clone(win.demoCompanyData.businessData);
      persist();
      // Refresh every view from the shared model first. Several DSO-wrapped
      // renderers schedule an assessment invalidation; start orchestration only
      // after those invalidations have observed the new dataset.
      try { win.updateDemoPages?.(); } catch (error) { console.error('Demo page refresh failed', error); }
      try { win.refreshOverviewAgent?.(); } catch (error) { console.error('Overview refresh failed', error); }
      try { win.refreshOverview?.(); } catch (error) { console.error('Overview metrics refresh failed', error); }
      try { win.refreshForecastDashboard?.(); } catch (error) { console.error('Forecast refresh failed', error); }
      try { win.refreshMarketIntelligence?.(); } catch (error) { console.error('Market refresh failed', error); }
      win.dispatchEvent(new win.CustomEvent('business-data-updated', { detail: { condition: win.businessData.condition, source: win.businessData.source } }));
      win.setTimeout(() => {
        try {
          if (typeof win.runDsoAnalysis === 'function') win.runDsoAnalysis();
          else {
            const status = $('#demo-reassessment-status');
            if (status) { status.classList.remove('is-running'); status.setAttribute('aria-busy', 'false'); status.textContent = 'Data loaded · Dynamic analysis is unavailable in this preview.'; }
          }
        } catch (error) {
          console.error('Demo business-state reassessment failed', error);
          const status = $('#demo-reassessment-status');
          if (status) { status.classList.remove('is-running'); status.setAttribute('aria-busy', 'false'); status.textContent = 'Data loaded · Assessment could not finish. Select Run Analysis to retry.'; }
        }
      }, 0);
    }
    function installUi() {
      let style = win.document.getElementById('cashflow-demo-style');
      if (!style) {
        style = win.document.createElement('style');
        style.id = 'cashflow-demo-style';
        style.textContent = '.demo-switch{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:11px 13px;margin:0 0 13px;border:1px solid #dce8ec;border-radius:9px;background:#fff}.demo-switch-copy{margin-right:auto;min-width:190px}.demo-switch-copy b{display:block;font-size:11px;color:#173b51}.demo-switch-copy small{display:block;color:#738596;font-size:9px;margin-top:2px}.demo-condition{appearance:none!important;-webkit-appearance:none!important;position:relative!important;z-index:20!important;pointer-events:auto!important;touch-action:manipulation;cursor:pointer!important;border:1px solid #dce5e9!important;background:#fff!important;color:#435a6b!important;border-radius:6px;padding:7px 9px;font-size:10px;font-weight:600}.demo-condition:hover{border-color:#17657a!important;color:#17657a!important}.demo-condition:focus-visible{outline:3px solid #71c8d4;outline-offset:2px}.demo-condition.active,.demo-condition[aria-pressed=true]{background:#17657a!important;border-color:#17657a!important;color:white!important}.demo-data-badge{display:inline-flex;align-items:center;gap:5px;background:#fff4df;color:#8a6025;border-radius:12px;padding:4px 8px;font-size:9px;font-weight:700}.demo-export{display:flex;gap:6px;flex-wrap:wrap;margin-left:4px}.demo-data-note{color:#718293;font-size:9px;margin:0 0 8px}.demo-scenario-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.demo-legend{font-size:9px;color:#687c8d}.demo-load-complete{border-color:#167e8a;background:#167e8a;color:#fff}.demo-load-complete:hover{background:#126a74;color:#fff}#demo-condition-overview{padding:14px 16px;margin:12px 0 12px;border-color:#d6e4e9;box-shadow:0 2px 7px #18344908}#demo-condition-overview .demo-switch-copy{flex:1 1 230px}#demo-condition-overview .demo-switch-copy b{font-size:13px}#demo-condition-overview .demo-switch-copy small{font-size:11px;line-height:1.45}#demo-condition-overview .demo-condition{padding:10px 15px;font-size:12px;border-radius:8px}#demo-reassessment-status{flex-basis:100%;padding-top:8px;border-top:1px solid #edf1f3;color:#687c8d;font-size:10px}#demo-reassessment-status.is-running{color:#167e8a;font-weight:650}#demo-reassessment-status.is-complete{color:#287a66}.demo-selected-snapshot{margin:0 0 16px;padding:15px 17px;border:1px solid #d6e4e9;border-radius:10px;background:#fff;box-shadow:0 2px 7px #18344908}.demo-snapshot-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.demo-snapshot-head strong{font-size:14px;color:#173b51}.demo-snapshot-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.demo-snapshot-cell{min-width:0;padding:10px 11px;border-radius:8px;background:#f5f8fa}.demo-snapshot-cell small{display:block;color:#718293;font-size:10px;margin-bottom:5px}.demo-snapshot-cell b{display:block;color:#173b51;font-size:16px;line-height:1.2;overflow-wrap:anywhere}.demo-snapshot-foot{margin:9px 0 0;color:#718293;font-size:10px}.demo-snapshot-risk{color:#b5534f!important}@media(max-width:760px){#demo-condition-overview .demo-condition{flex:1 1 130px}.demo-snapshot-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}';
        win.document.head.appendChild(style);
      }
      const controls = (idPrefix) => `<div class="demo-switch" data-demo-switch="${idPrefix}"><div class="demo-switch-copy"><div class="demo-scenario-head"><b>Demo business condition</b><span class="demo-data-badge">SIMULATED DEMO DATA</span></div><small id="demo-condition-copy">${esc(win.demoCompanyData.conditionNote)}</small></div><button type="button" class="demo-condition" data-demo-condition="stable" aria-pressed="false">Stable Business</button><button type="button" class="demo-condition" data-demo-condition="risk" aria-pressed="false">Liquidity Risk</button><button type="button" class="demo-condition" data-demo-condition="growth" aria-pressed="false">Growth + Cash Pressure</button><span class="demo-export"><button type="button" class="btn" data-demo-export="transactions">Download CSV</button><button type="button" class="btn" data-demo-export="dictionary">Data Dictionary</button></span></div>`;
      const overview = $('#overview');
      if (overview && !$('#demo-condition-overview')) {
        const wrap = win.document.createElement('div'); wrap.id = 'demo-condition-overview'; wrap.innerHTML = controls('overview');
        const heading = overview.querySelector('.heading'); if (heading) heading.insertAdjacentElement('afterend', wrap);
      }
      const overviewSwitch = $('#demo-condition-overview');
      if (overviewSwitch && !$('#demo-selected-snapshot')) {
        const snapshot = win.document.createElement('section'); snapshot.id = 'demo-selected-snapshot'; snapshot.className = 'demo-selected-snapshot'; snapshot.setAttribute('aria-live', 'polite');
        overviewSwitch.insertAdjacentElement('afterend', snapshot);
      }
      const agent = $('#agent');
      if (agent && !$('#demo-condition-agent')) {
        const wrap = win.document.createElement('div'); wrap.id = 'demo-condition-agent'; wrap.innerHTML = controls('agent');
        const command = agent.querySelector('.command-card'); if (command) command.insertAdjacentElement('beforebegin', wrap);
      }
      const config = $('#configuration');
      if (config && !$('#demo-data-downloads')) {
        const hub = config.querySelector('#data-hub');
        if (hub) {
          const card = win.document.createElement('article'); card.id = 'demo-data-downloads'; card.className = 'card'; card.style.marginTop = '12px';
           card.innerHTML = `<div class="title"><div><div class="eyebrow">PRESENTER DATASET</div><h2>ABC Lifestyle Store · Demo Data</h2><p>90 days of dated history and a 30-day forecast, generated from one reconciled simulated ledger.</p></div><span class="demo-data-badge">SIMULATED DEMO DATA</span></div><div class="demo-data-note">Company profile: SME retail · SGD · online and offline. Historical transactions are illustrative. Market observations are simulated assumptions, not external market feeds.</div><div class="demo-switch" aria-label="Predefined business datasets"><button class="demo-condition" data-demo-condition="stable">Stable Business</button><button class="demo-condition" data-demo-condition="risk">Increasing Liquidity Risk</button><button class="demo-condition" data-demo-condition="growth">Growth Opportunity + Financial Pressure</button><button class="btn demo-load-complete" id="load-complete-demo">Load Complete Demo Dataset</button><button class="btn" id="reset-demo-original">Reset to Original Dataset</button></div><div class="demo-export"><button class="btn primary" data-demo-export="transactions">Download Current Dataset CSV</button><button class="btn" data-demo-export="dictionary">Download Data Dictionary</button></div><div class="demo-data-note" id="demo-export-status" aria-live="polite"></div>`;
          hub.insertAdjacentElement('afterend', card);
        }
      }
      const modalActions = $('#hub-modal .hubbuts');
      if (modalActions && !$('#modal-load-complete-demo')) {
        const actions = win.document.createElement('span');
        actions.className = 'demo-export';
        actions.innerHTML = '<button class="btn demo-load-complete" id="modal-load-complete-demo" type="button">Load Complete Demo Dataset</button><button class="btn" id="modal-reset-demo-original" type="button">Reset to Original Dataset</button>';
        modalActions.insertAdjacentElement('beforebegin', actions);
      }
      // Use a document-level capture handler for scenario controls. The page is
      // a hash-routed app and some views replace their contents after render;
      // delegated handling keeps the buttons live across those replacements.
      if (!win.__cashFlowDemoDelegatesInstalled) {
        win.__cashFlowDemoDelegatesInstalled = true;
        win.document.addEventListener('click', event => {
          const conditionButton = event.target?.closest?.('[data-demo-condition]');
          if (conditionButton) {
            event.preventDefault();
            event.stopImmediatePropagation();
            try { selectCondition(conditionButton.dataset.demoCondition); }
            catch (error) {
              console.error('Demo scenario selection failed', error);
              const status = $('#demo-reassessment-status');
              if (status) { status.classList.remove('is-running'); status.setAttribute('aria-busy', 'false'); status.textContent = 'Scenario could not load. Please refresh the page and try again.'; }
            }
            return;
          }
          const exportButton = event.target?.closest?.('[data-demo-export]');
          if (exportButton) { event.preventDefault(); exportFile(exportButton.dataset.demoExport); }
        }, true);
      }
       $('#load-complete-demo')?.addEventListener('click', () => win.loadCompleteDemoDataset?.(win.demoCompanyData.condition));
       $('#reset-demo-original')?.addEventListener('click', () => win.resetDemoDataset?.());
       $('#modal-load-complete-demo')?.addEventListener('click', () => win.loadCompleteDemoDataset?.(win.demoCompanyData.condition));
       $('#modal-reset-demo-original')?.addEventListener('click', () => win.resetDemoDataset?.());
      updateControls();
    }
    function updateControls() {
      const activeCondition = win.__cashFlowDemoScenarioActive
        ? (win.businessData?.condition || win.demoCompanyData?.condition || null)
        : null;
      win.document.querySelectorAll('[data-demo-condition]').forEach(btn => {
        const active = !!activeCondition && btn.dataset.demoCondition === activeCondition;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      win.document.querySelectorAll('#demo-condition-copy').forEach(el => { el.textContent = win.__cashFlowDemoScenarioActive ? 'Selected dataset is the analysis input; the Agent assesses the business state independently.' : 'Manual or imported business data is active. Select a demo condition to replace it.'; });
      renderSelectedSnapshot();
    }
    function renderSelectedSnapshot() {
      const host = $('#demo-selected-snapshot');
      if (!host) return;
      const selected = win.demoCompanyData || {}, data = win.businessData || {}, profile = selected.businessData?.demoProfile || data.demoProfile || {};
      if (!win.__cashFlowDemoScenarioActive || data.source !== 'simulated-demo') {
        host.innerHTML = '<div class="demo-snapshot-head"><strong>Active business data</strong><span class="demo-data-badge">MANUAL / IMPORTED</span></div><div class="demo-snapshot-foot">Select a demo condition above to load its figures into the shared workspace model.</div>';
        return;
      }
      const currency = profile.currency || data.currency || 'SGD';
      const money = value => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-SG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value)) : 'Insufficient data';
      const start = profile.forecastStart || data.asOfDate || '';
      const end = profile.forecastEnd || '';
      const cashInflowTypes = new Set(['receipt']);
      const cashOutflowTypes = new Set(['expense', 'supplier', 'inventory']);
      const events = (data.records || []).filter(row => row.date > (profile.historicalEnd || data.asOfDate || '') && (!end || row.date <= end) && (cashInflowTypes.has(row.type) || cashOutflowTypes.has(row.type)));
      const byDate = new Map();
      events.forEach(row => { const day = byDate.get(row.date) || { inflow: 0, outflow: 0 }; if (cashInflowTypes.has(row.type)) day.inflow += Number(row.amount) || 0; else day.outflow += Number(row.amount) || 0; byDate.set(row.date, day); });
      let balance = Number(profile.cash ?? data.cash), minimum = balance, minimumDate = start;
      [...byDate.keys()].sort().forEach(date => { const day = byDate.get(date); balance += day.inflow - day.outflow; if (balance < minimum) { minimum = balance; minimumDate = date; } });
      const reserve = Number(profile.safe ?? data.safe), belowReserve = minimum < reserve;
      const label = selected.conditionLabel || data.conditionLabel || 'Selected demo scenario';
      host.innerHTML = `<div class="demo-snapshot-head"><strong>${esc(label)} · Active workspace data</strong><span class="demo-data-badge">SIMULATED DEMO DATA</span></div><div class="demo-snapshot-grid"><div class="demo-snapshot-cell"><small>Current cash</small><b>${esc(money(profile.cash ?? data.cash))}</b></div><div class="demo-snapshot-cell"><small>30-day forecast minimum</small><b class="${belowReserve ? 'demo-snapshot-risk' : ''}">${esc(money(minimum))}</b></div><div class="demo-snapshot-cell"><small>Minimum date</small><b>${esc(minimumDate || 'Insufficient data')}</b></div><div class="demo-snapshot-cell"><small>Safety reserve</small><b>${esc(money(reserve))}</b></div><div class="demo-snapshot-cell"><small>Forecast closing cash</small><b>${esc(money(balance))}</b></div></div><p class="demo-snapshot-foot">${esc(start)} to ${esc(end)} · ${(data.records || []).length.toLocaleString()} shared records · ${belowReserve ? `Forecast falls below reserve by ${esc(money(reserve - minimum))}.` : 'Forecast stays above the safety reserve.'}</p>`;
    }
    function selectCondition(key) {
      if (!validCondition(key)) key = 'growth';
      // Invalidate any analysis still running against the previous scenario.
      win.__cashFlowDemoSelectionId = (win.__cashFlowDemoSelectionId || 0) + 1;
      win.__cashFlowDemoScenarioActive = true;
      win.demoCompanyData = clone(pristine[key]);
      win.businessData = clone(win.demoCompanyData.businessData);
      try { win.localStorage.setItem(STORAGE.condition, key); win.localStorage.setItem(STORAGE.activeDemo, 'true'); } catch (_) {}
      const assessment = $('#demo-reassessment-status');
      if (assessment) { assessment.classList.add('is-running'); assessment.classList.remove('is-complete'); assessment.setAttribute('aria-busy', 'true'); assessment.textContent = `Loading ${win.demoCompanyData.conditionLabel} dataset and reassessing business state…`; }
      // Update the selected treatment and figures synchronously before kicking
      // off the downstream page/agent recalculations, then reconcile once more.
      updateControls();
      refresh();
      updateControls();
      const status = $('#hub-validation'); if (status) status.textContent = `${win.demoCompanyData.conditionLabel} loaded · ${win.businessData.records.length.toLocaleString()} unified records · 90 historical days · 30-day horizon.`;
      const exportStatus = $('#demo-export-status'); if (exportStatus) exportStatus.textContent = `${win.demoCompanyData.conditionLabel} is active across the shared business model.`;
    }
    win.addEventListener('dso-analysis-complete', event => {
      const el = $('#demo-reassessment-status');
      if (!el || !event.detail) return;
      const detail = event.detail;
      if (win.__cashFlowDemoScenarioActive &&
          (detail.selectionId !== (win.__cashFlowDemoSelectionId || 0) ||
           (detail.condition && detail.condition !== win.businessData?.condition))) return;
      if (detail.status === 'error') {
        el.classList.remove('is-running', 'is-complete'); el.setAttribute('aria-busy', 'false');
        el.textContent = detail.message || 'Assessment could not finish. Select Run Analysis to retry.';
        return;
      }
      const names = detail.skills || [], visible = names.slice(0, 4);
      const more = names.length > visible.length ? ` +${names.length - visible.length} more` : '';
      el.classList.remove('is-running'); el.classList.add('is-complete'); el.setAttribute('aria-busy', 'false');
      el.textContent = `Assessment complete · independently assessed state: ${detail.state} · Skills activated: ${visible.join(', ') || 'none'}${more}`;
    });
    function persist() {
      try {
        win.localStorage.setItem(STORAGE.model, JSON.stringify(win.businessData || {}));
        win.localStorage.setItem(STORAGE.activeDemo, win.__cashFlowDemoScenarioActive ? 'true' : 'false');
        if (validCondition(win.businessData?.condition || win.demoCompanyData?.condition)) win.localStorage.setItem(STORAGE.condition, win.businessData.condition || win.demoCompanyData.condition);
      } catch (_) {}
    }
    function download(name, content, type) {
      const blob = new Blob([content], { type: type || 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob), a = win.document.createElement('a');
      a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function exportFile(kind) {
      const d = win.demoCompanyData, name = d.condition;
      if (kind === 'dictionary') {
        download('abc-lifestyle-store-data-dictionary.md', win.CashFlowDemoData.dataDictionary(), 'text/markdown;charset=utf-8');
        return;
      }
      const records = exportRows(d);
      download(`abc-lifestyle-store-${name}-simulated-demo.csv`, toCsv(records), 'text/csv;charset=utf-8');
      const status = $('#demo-export-status'); if (status) status.textContent = `Exported ${records.length.toLocaleString()} linked records for ${d.conditionLabel}.`;
    }
    const oldLoad = win.loadSampleBusiness;
    const oldRun = win.runBusinessAnalysis;
    const oldRemove = win.removeBusinessData;
    const oldImport = win.importCSV;
    const oldSavedLoad = win.loadBusinessData;
     function writeQuickDemoForm(data) {
      const doc = win.document;
      const set = (id, value) => { const el = doc.getElementById(id); if (el) el.value = value; };
      set('f-type', data.businessType); set('f-currency', data.currency); set('f-cash', data.cash);
      set('f-period', data.period); set('f-safe', data.safe); set('d-cash', data.openingCash);
       const today = data.asOfDate || data.demoProfile?.historicalEnd;
      const offset = date => Math.max(1, dayDiff(date, today));
      const grouped = (types, category) => {
        const sums = new Map();
        data.records.filter(r => types.includes(r.type) && r.recordClass === 'forecast' && r.date > today && offset(r.date) <= 30)
          .forEach(r => { const key = `${offset(r.date)}|${category ? (r.expenseCategory || r.category || r.description) : 'Cash receipt'}`; sums.set(key, (sums.get(key) || 0) + Number(r.amount || 0)); });
        return [...sums.entries()].map(([key, amount]) => { const [day, name] = key.split('|'); return `${day},${money(amount)},${name}`; }).join('\n');
      };
      set('f-receipts', grouped(['receipt'], false)); set('f-ar', '');
      set('f-expenses', grouped(['expense'], true)); set('f-suppliers', grouped(['supplier', 'inventory'], true));
       const detail = doc.getElementById('detail-rows');
       if (detail) detail.value = data.records.filter(r => ['receipt','expense','supplier','inventory','revenue','cogs','opex'].includes(r.type)).map(r => [r.date, r.type, String(r.description || '').replace(/,/g, ' '), r.amount].join(',')).join('\n');
       win.__completeDemoFormSignature = quickFormSignature();
    }
     function quickFormSignature() {
       return ['f-type','f-currency','f-cash','f-period','f-safe','f-receipts','f-ar','f-expenses','f-suppliers','d-cash','detail-rows']
         .map(id => { const el = win.document.getElementById(id); return el ? `${id}:${el.value}` : ''; }).join('\n');
     }
    win.loadDemoCondition = selectCondition;
     win.loadCompleteDemoDataset = function (key) {
       selectCondition(key || win.demoCompanyData.condition || 'growth');
       writeQuickDemoForm(win.businessData);
       if ($('#hub-modal')) $('#hub-modal').classList.add('show');
       const status = $('#hub-validation'); if (status) status.textContent = `${win.demoCompanyData.conditionLabel} loaded into the shared model and scenario inputs · 90 historical days · 30-day forecast · ${win.businessData.records.length.toLocaleString()} records.`;
       return win.businessData;
     };
     win.resetDemoDataset = function () {
       const key = validCondition(win.demoCompanyData?.condition) ? win.demoCompanyData.condition : 'growth';
       selectCondition(key);
       writeQuickDemoForm(win.businessData);
       const status = $('#hub-validation'); if (status) status.textContent = `${win.demoCompanyData.conditionLabel} restored to its original, reproducible dataset.`;
       return win.businessData;
     };
    win.loadSampleBusiness = function () {
       return win.loadCompleteDemoDataset('growth');
    };
     win.resetBusinessData = win.resetDemoDataset;
     const oldOpenInput = win.openDemoInput;
     if (typeof oldOpenInput === 'function' && !oldOpenInput.__completeDemoWrapped) {
       const wrappedOpen = function () {
         const result = oldOpenInput.apply(this, arguments);
         if (win.__cashFlowDemoScenarioActive && win.businessData?.source === 'simulated-demo') writeQuickDemoForm(win.businessData);
         else win.__completeDemoFormSignature = null;
         return result;
       };
       wrappedOpen.__completeDemoWrapped = true;
       win.openDemoInput = wrappedOpen;
     }
    win.runBusinessAnalysis = function () {
      const modal = $('#hub-modal');
      if (modal?.classList.contains('show') && typeof oldRun === 'function') {
        if (typeof win.validateDemoInput === 'function' && !win.validateDemoInput()) return oldRun.apply(this, arguments);
         if (win.__completeDemoFormSignature) {
           const formChanged = quickFormSignature() !== win.__completeDemoFormSignature;
           if (formChanged) {
             const base = win.businessData;
             // The legacy form parser is closure-scoped; reuse its validated current result via the existing validator path.
             // Keep the submitted 90-day history and replace only dated future cash events with edited assumptions.
             const currentForm = (() => {
               const form = win.document, today = base.asOfDate || DEFAULT_AS_OF;
               const get = id => form.getElementById(id);
               const detail = get('detail-form')?.hidden === false;
               const rows = [];
               if (detail) {
                 get('detail-rows')?.value.split(/\r?\n/).filter(Boolean).forEach(line => { const a=line.split(','); rows.push({date:String(a[0]||'').trim(),type:String(a[1]||'').trim().toLowerCase(),description:String(a[2]||'').trim(),amount:Number(a[3])}); });
               } else {
                 const add=(id,type)=>get(id)?.value.split(/\r?\n/).filter(Boolean).forEach(line=>{const a=line.split(','); const day=Number(a[0]); if(Number.isFinite(day)){const dt=new Date(`${today}T12:00:00`);dt.setDate(dt.getDate()+day);rows.push({date:`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`,type,description:String(a[2]||a[1]||type).trim(),amount:Number(a[1])});}});
                 add('f-receipts','receipt'); add('f-ar','receipt'); add('f-expenses','expense'); add('f-suppliers','supplier');
               }
               const cash = Number((detail ? get('d-cash') : get('f-cash'))?.value);
               const historical = base.records.filter(r => r.date <= today || ['revenue','cogs','opex','overdue_receivable'].includes(r.type));
               const forecast = rows.filter(r => r.date > today && Number.isFinite(r.amount) && r.amount > 0).map(r => ({...r,recordClass:'forecast',sourceLabel:'SIMULATED DEMO ASSUMPTION'}));
               const next = {...base,businessType:get('f-type')?.value||base.businessType,currency:get('f-currency')?.value||base.currency,cash:Number.isFinite(cash)?cash:base.cash,period:Number(get('f-period')?.value)||base.period,safe:Number(get('f-safe')?.value)||base.safe,records:[...historical,...forecast].sort((a,b)=>a.date.localeCompare(b.date)),updated:new Date().toLocaleDateString()};
               next.source='simulated-demo'; next.sourceLabel='SIMULATED DEMO DATA · edited scenario assumptions';
               return next;
             })();
             win.businessData=currentForm;
             win.demoCompanyData.businessData=clone(currentForm);
           }
           win.__completeDemoFormSignature = null;
           win.__cashFlowDemoScenarioActive = true;
           refresh(); updateControls();
           modal.classList.remove('show');
           if (typeof win.go === 'function') win.go('agent');
           const status=$('#hub-validation'); if(status)status.textContent='Analysis refreshed from the active shared dataset. Historical and financial records were retained; edited forecast assumptions were applied.';
           return win.businessData;
         }
        win.__cashFlowDemoScenarioActive = false;
        const result = oldRun.apply(this, arguments);
         persist();
        updateControls();
        return result;
      }
      win.__cashFlowDemoScenarioActive = true;
       try { win.localStorage.setItem(STORAGE.activeDemo, 'true'); } catch (_) {}
      refresh();
      if (typeof win.go === 'function') win.go('agent');
      return win.demoCompanyData;
    };
     if (typeof oldRemove === 'function') win.removeBusinessData = function () { win.__cashFlowDemoScenarioActive = false; const result = oldRemove.apply(this, arguments); persist(); updateControls(); refresh(); return result; };
     if (typeof oldImport === 'function') win.importCSV = function () { win.__cashFlowDemoScenarioActive = false; const result = oldImport.apply(this, arguments); persist(); updateControls(); return result; };
     if (typeof oldSavedLoad === 'function') win.loadBusinessData = function () { win.__cashFlowDemoScenarioActive = false; const result = oldSavedLoad.apply(this, arguments); persist(); updateControls(); refresh(); return result; };
     win.addEventListener('business-data-updated', () => { if (!win.__restoringDemoDataset) persist(); });
    win.downloadDemoDataset = () => exportFile('transactions');
    win.downloadDemoDictionary = () => exportFile('dictionary');
    win.CashFlowDemoData = Object.assign(win.CashFlowDemoData, { generate, toCsv, selectCondition, current: () => win.demoCompanyData });
    installUi();
    refresh();
    const initialAssessment = win.evaluateDsoScenario?.(win.businessData);
    const initialStatus = $('#demo-reassessment-status');
    if (initialAssessment && initialStatus) {
      initialStatus.setAttribute('aria-busy', 'false');
      initialStatus.textContent = `Assessed business state: ${initialAssessment.state} · Select a scenario to reassess and orchestrate relevant Skills.`;
    }
    if (win.document.readyState === 'loading') win.document.addEventListener('DOMContentLoaded', () => { installUi(); refresh(); }, { once: true });
    if (oldLoad && !win.__legacySampleCaptured) win.__legacySampleCaptured = true;
    win.__cashFlowDemoInstalled = true;
  }
  function dataDictionary() {
    return `# ABC Lifestyle Store · Simulated Demo Data Dictionary\n\nAll records are generated for demonstration. They are not real customer, supplier, market, or bank records. Currency: SGD. Historical window: 90 days ending on the generation date. Forecast window: the following 30 days.\n\nThe downloadable CSV is a normalized multi-table export. The \`dataset\` field identifies each row family; blank columns are not applicable to that family.\n\n## Row families\n\n| dataset | Contents |\n|---|---|\n| business_profile | Company type, currency, date coverage, scenario, and source status. |\n| sales | Dated sales transactions, products, quantities, and collection assumptions. |\n| cash_inflow | Actual receipts and dated forecast collections. |\n| expense_cash_outflow | Actual and forecast operating or supplier cash payments. |\n| inventory_procurement | Purchase orders, units, unit cost, supplier, and payment terms. |\n| accounts_receivable / accounts_payable | Open invoice balances and due dates linked to the underlying sale or purchase. |\n| daily_inventory | SKU-level opening stock + replenishments − units sold = closing stock. |\n| daily_cash_balance | Dated cash inflows, outflows, and reconciled daily closing balance. |\n| daily_business_performance | Revenue, units sold, demand proxy, and marketing spend by day. |\n| simulated_market_observation | Generated demand indexes; internal demo assumptions, not external research. |\n\n## Common fields\n\n| Field | Meaning |\n|---|---|\n| transactionId / invoiceId / purchaseOrderId | Stable simulated identifier used to reconcile linked records. |\n| date / transactionDate / invoiceDate | Sale, movement, invoice, or scheduled-event date in YYYY-MM-DD format. |\n| dueDate / expectedPaymentDate / paymentDate / actualPaymentDate | Contractual, expected, and actual payment or collection dates. Blank means not paid or not applicable. |\n| recordType / type | Sale, receipt, expense, supplier, inventory, revenue, COGS, or operating expense classification. |\n| category / expenseCategory / productName / sku | Product, inventory, or operating-cost classification. |\n| quantity / unitSellingPrice / unitCost | Units and per-unit price or cost. |\n| amount / outstandingAmount / purchaseCost | SGD amount. Sales are revenue; receipts and payment rows are cash events, not duplicate recognized revenue. |\n| paymentMethod / paymentStatus / status | Simulated payment channel and settlement state. |\n| sourceLabel / dataStatus / recordClass | Provenance. Values distinguish simulated historical records, forecasts, and assumptions. |\n| phase / growthInvestment | Business phase or explicit growth-investment flag. |\n| customerId / customerName / supplier | Simulated counterparties; not real people or companies. |\n\n## Reconciliation notes\n\n- Sales revenue is recognized on transaction date. Cash receipts use actual or expected collection date; unpaid sales remain in accounts receivable and are not counted as cash received.\n- Cash balance is opening cash plus settled cash inflows minus settled cash outflows through the as-of date. Forecast events are separately labeled.\n- Inventory closes as opening units plus replenishment units minus units sold for each SKU and date. Supplier invoices carry 14-day terms unless explicitly labeled as a growth deposit.\n- Accounts receivable and payable link back to the associated sale or purchase order.\n- Market demand indexes are simulated assumptions and do not represent external market research.\n`;
  }
   return { generate, exportRows, toCsv, dataDictionary, conditions: CONDITIONS, defaultAsOf: DEFAULT_AS_OF };
});
