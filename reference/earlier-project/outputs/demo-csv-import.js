(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CashFlowDemoCsvImport = api;
  if (typeof window !== 'undefined' && window.document) api.install(window);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseCsv(text) {
    const rows = [];
    let row = [], value = '', quoted = false;
    const input = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (quoted) {
        if (ch === '"' && input[i + 1] === '"') { value += '"'; i++; }
        else if (ch === '"') quoted = false;
        else value += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(value); value = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && input[i + 1] === '\n') i++;
        row.push(value); value = '';
        if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
        row = [];
      } else value += ch;
    }
    if (value.length || row.length) { row.push(value); if (row.some(cell => String(cell).trim() !== '')) rows.push(row); }
    if (quoted) throw new Error('CSV contains an unclosed quoted field.');
    if (!rows.length) throw new Error('The CSV file is empty.');
    const headers = rows.shift().map(h => String(h).trim());
    const data = rows.map((cells, index) => {
      const record = { __row: index + 2 };
      headers.forEach((header, i) => { record[header] = String(cells[i] == null ? '' : cells[i]).trim(); });
      return record;
    });
    return { headers, rows: data };
  }

  const dateOk = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(Date.parse(value + 'T00:00:00Z'));
  const num = value => value === '' || value == null ? null : Number(String(value).replace(/,/g, ''));
  const amount = (row, ...fields) => {
    for (const field of fields) { const value = num(row[field]); if (value != null && Number.isFinite(value)) return value; }
    return null;
  };
  const clean = value => String(value || '').trim();

  function normalizeBusinessCsv(text) {
    const parsed = parseCsv(text), headers = new Set(parsed.headers), rows = parsed.rows;
    if (!headers.has('dataset')) return { recognized: false, parsed };
    const families = new Set(rows.map(r => clean(r.dataset)));
    const expected = ['business_profile', 'daily_cash_balance', 'cash_inflow', 'expense_cash_outflow'];
    const missingFamilies = expected.filter(name => !families.has(name));
    if (missingFamilies.length) return { recognized: true, errors: ['Missing required dataset sections: ' + missingFamilies.join(', ') + '.'], parsed };

    const profile = rows.find(r => r.dataset === 'business_profile') || {};
    const cashRows = rows.filter(r => r.dataset === 'daily_cash_balance' && dateOk(r.date)).sort((a, b) => a.date.localeCompare(b.date));
    const historicalEnd = clean(profile.historicalEnd) || cashRows.at(-1)?.date;
    const historyBalance = [...cashRows].filter(r => !historicalEnd || r.date <= historicalEnd).at(-1);
    const openingCash = amount(cashRows[0] || {}, 'openingBalance');
    const currentCash = amount(historyBalance || {}, 'closingBalance');
    const forecastStart = clean(profile.forecastStart) || (historicalEnd ? addDays(historicalEnd, 1) : '');
    const forecastEnd = clean(profile.forecastEnd);
    const periodStart = dateOk(forecastStart) ? forecastStart : '';
    const periodEnd = dateOk(forecastEnd) ? forecastEnd : '';
    const period = dateOk(periodStart) && dateOk(periodEnd) ? Math.max(1, Math.floor((Date.parse(periodEnd + 'T00:00:00Z') - Date.parse(periodStart + 'T00:00:00Z')) / 86400000) + 1) : null;
    const records = [], errors = [], warnings = [];
    let skipped = 0;
    const addRecord = (row, type, date, value, description, extra = {}) => {
      if (!dateOk(date) || value == null || !Number.isFinite(value) || value <= 0) { skipped++; return; }
      records.push({
        date, type, description: description || type, amount: Math.round(value * 100) / 100,
        category: clean(row.category || row.expenseCategory), counterparty: clean(row.customerName || row.supplier),
        reference: clean(row.transactionId || row.invoiceId || row.purchaseOrderId),
        status: clean(row.paymentStatus || row.status || row.recordClass),
        recordClass: clean(row.recordClass || row.dataStatus), sourceLabel: clean(row.sourceLabel) || clean(profile.dataNature) || 'Imported CSV',
        ...extra
      });
    };

    rows.filter(r => r.dataset === 'cash_inflow').forEach(r => {
      const t = clean(r.type).toLowerCase();
      if (t !== 'receipt') { skipped++; return; }
      addRecord(r, 'receipt', r.date, amount(r, 'amount'), r.description || r.recordType || 'Cash receipt', { expectedPaymentDate: clean(r.expectedPaymentDate), paymentMethod: clean(r.paymentMethod) });
    });
    rows.filter(r => r.dataset === 'expense_cash_outflow').forEach(r => {
      const type = clean(r.type).toLowerCase();
      if (!['expense', 'supplier', 'inventory'].includes(type)) { skipped++; return; }
      addRecord(r, type, r.date, amount(r, 'amount'), r.description || r.expenseCategory || r.recordType || 'Cash outflow', { dueDate: clean(r.dueDate), paymentMethod: clean(r.paymentMethod) });
    });

    // Preserve the recognized financial records if this is a newer export version.
    rows.filter(r => r.dataset === 'business_financial_record').forEach(r => {
      const type = clean(r.type).toLowerCase();
      if (['revenue', 'cogs', 'opex', 'overdue_receivable'].includes(type)) addRecord(r, type, r.date, amount(r, 'amount'), r.description, { dueDate: clean(r.dueDate) });
    });
    // Older generated exports have no normalized financial-record family. Sales and AR
    // provide defensible revenue and overdue-receivable evidence without inventing COGS.
    if (!families.has('business_financial_record')) {
      rows.filter(r => r.dataset === 'sales' && clean(r.recordType).toLowerCase() === 'sale' && (!clean(r.dataStatus) || /actual/i.test(r.dataStatus))).forEach(r => {
        addRecord(r, 'revenue', r.date, amount(r, 'amount'), (r.productName || 'Sales') + ' revenue', { category: clean(r.category), reference: clean(r.transactionId) });
      });
      rows.filter(r => r.dataset === 'accounts_receivable' && /overdue/i.test(r.status)).forEach(r => {
        addRecord(r, 'overdue_receivable', r.dueDate || r.expectedPaymentDate || r.invoiceDate, amount(r, 'outstandingAmount', 'amount'), 'Overdue receivable · ' + (r.customerName || r.invoiceId || 'invoice'), { dueDate: clean(r.dueDate), reference: clean(r.invoiceId) });
      });
      warnings.push('This file does not include a normalized business_financial_record section. Revenue is mapped from sales; cost of goods sold is left unavailable rather than estimated.');
    }
    if (skipped) warnings.push(skipped + ' blank, unsupported, or invalid rows were skipped during normalization.');
    if (openingCash == null) errors.push('Could not find an openingBalance in daily_cash_balance.');
    if (currentCash == null) errors.push('Could not find a closingBalance for the latest historical daily_cash_balance row.');
    if (!clean(profile.currency)) errors.push('The business_profile row is missing currency.');
    if (!period) errors.push('Could not determine a valid forecast period from forecastStart and forecastEnd.');
    if (!records.some(r => ['receipt', 'expense', 'supplier', 'inventory'].includes(r.type))) errors.push('No usable dated cash events were found.');

    const futureOutflows = records.filter(r => ['expense', 'supplier', 'inventory'].includes(r.type) && dateOk(r.date) && r.date >= (periodStart || '9999') && r.date <= (periodEnd || '0000')).reduce((sum, r) => sum + r.amount, 0);
    const explicitSafe = amount(profile, 'safe', 'minimumSafeCash', 'minimumCashReserve');
    const safe = explicitSafe != null ? explicitSafe : futureOutflows > 0 ? Math.ceil(futureOutflows * 1.1) : null;
    if (safe == null) warnings.push('No minimum cash reserve was supplied and forecast outflows are unavailable; liquidity threshold will remain insufficient until entered.');
    const now = new Date();
    const businessType = clean(profile.type || profile.businessType || profile.model) || 'Imported SME dataset';
    const companyName = clean(profile.companyName || profile.company) || 'Imported business';
    const sourceNature = clean(profile.dataNature) || 'User-provided CSV';
    const businessData = {
      businessType, companyName, currency: clean(profile.currency), cash: currentCash, openingCash,
      period, safe, salesGrowth: amount(profile, 'salesGrowth') ?? 0, delay: amount(profile, 'delay') ?? 0,
      cost: amount(profile, 'cost') ?? 0, source: 'import', sourceLabel: sourceNature + ' · Imported CSV',
      dataNature: sourceNature, updated: now.toLocaleString(), asOfDate: historicalEnd || cashRows.at(-1)?.date || '',
      condition: clean(profile.condition), conditionLabel: clean(profile.conditionLabel), conditionNote: clean(profile.conditionNote),
      records: records.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type)),
      marketData: [], // Simulated market observations in this export are not external evidence.
      simulatedMarketAssumptions: rows.filter(r => r.dataset === 'simulated_market_observation').length,
      importMetadata: { format: 'normalized-multi-table-csv', historicalStart: clean(profile.historicalStart), historicalEnd, forecastStart, forecastEnd, safeMethod: explicitSafe != null ? 'Provided by CSV' : safe != null ? '110% of dated forecast cash outflows in the forecast period' : 'Not available', warnings }
    };
    const completeness = Math.round(([
      !!businessData.businessType, !!businessData.currency, Number.isFinite(currentCash), Number.isFinite(safe),
      records.some(r => r.type === 'receipt'), records.some(r => ['expense', 'supplier', 'inventory'].includes(r.type)),
      Number.isFinite(period), !!historicalEnd
    ].filter(Boolean).length / 8) * 100);
    return {
      recognized: true, errors, warnings, businessData,
      summary: { companyName, currency: businessData.currency, recordCount: records.length, cashEventCount: records.filter(r => ['receipt', 'expense', 'supplier', 'inventory'].includes(r.type)).length, skipped, completeness, historicalStart: clean(profile.historicalStart) || cashRows[0]?.date || 'Not available', historicalEnd: historicalEnd || 'Not available', forecastStart: forecastStart || 'Not available', forecastEnd: forecastEnd || 'Not available', currentCash, safe, datasetFamilies: [...families].sort(), simulatedMarketRows: businessData.simulatedMarketAssumptions }
    };
  }

  function addDays(date, amount) {
    if (!dateOk(date)) return '';
    const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + amount);
    return d.toISOString().slice(0, 10);
  }

  function install(win) {
    if (!win || win.__cashFlowWideCsvInstalled) return;
    win.__cashFlowWideCsvInstalled = true;
    const legacyImport = win.importCSV;
    let pending = null;
    const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const money = (value, currency) => {
      try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(value); }
      catch (_) { return String(Math.round(value)); }
    };
    function show(message, isError) {
      const box = win.document.getElementById('csv-message');
      if (!box) return;
      box.hidden = false; box.textContent = message;
      box.style.borderColor = isError ? '#e2a29a' : '#b9dcd8';
    }
    function preview(result, fileName) {
      const s = result.summary, box = win.document.getElementById('csv-message');
      if (!box) return;
      const old = win.document.getElementById('wide-csv-preview'); old?.remove();
      const panel = win.document.createElement('div'); panel.id = 'wide-csv-preview'; panel.className = 'hubnote';
      panel.innerHTML = '<b>Recognized multi-table business CSV</b><br>' +
        esc(fileName) + ' · ' + esc(s.companyName) + ' · ' + esc(s.recordCount) + ' normalized records<br>' +
        'Historical: ' + esc(s.historicalStart) + ' to ' + esc(s.historicalEnd) + ' · Forecast: ' + esc(s.forecastStart) + ' to ' + esc(s.forecastEnd) + '<br>' +
        'Current cash: ' + esc(money(s.currentCash, s.currency)) + ' · Minimum reserve: ' + esc(s.safe == null ? 'Insufficient data' : money(s.safe, s.currency)) + ' · Completeness: ' + esc(s.completeness) + '%<br>' +
        'Detected sections: ' + esc(s.datasetFamilies.join(', ')) + '<br>' +
        '<small>Market observations in this file are generated assumptions, not connected external market data. Import is staged; the active dataset has not changed.</small>' +
        (result.warnings.length ? '<ul>' + result.warnings.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul>' : '') +
        '<div class="hubbuts"><button type="button" class="btn primary" id="wide-csv-apply">Use this dataset</button><button type="button" class="btn" id="wide-csv-cancel">Cancel</button></div>';
      box.insertAdjacentElement('afterend', panel);
      panel.querySelector('#wide-csv-apply').addEventListener('click', applyPending);
      panel.querySelector('#wide-csv-cancel').addEventListener('click', () => { pending = null; panel.remove(); show('Import cancelled. The current dataset is unchanged.', false); });
    }
    function applyPending() {
      if (!pending) return;
      const { businessData, summary } = pending;
      win.__cashFlowDemoScenarioActive = false;
      win.businessData = businessData;
      try { win.localStorage.setItem('sme-cashflow-model', JSON.stringify(businessData)); } catch (_) {}
      pending = null;
      win.document.getElementById('wide-csv-preview')?.remove();
      if (typeof win.render === 'function') win.render();
      win.updateDemoPages?.();
      win.refreshFinancialLedgerPages?.();
      win.refreshForecastDashboard?.();
      win.refreshOverview?.();
      win.refreshOverviewAgent?.();
      win.refreshMarketIntelligence?.();
      win.runDsoAnalysis?.();
      win.dispatchEvent(new win.CustomEvent('business-data-updated', { detail: { source: 'import', recordCount: summary.recordCount } }));
      show('Imported ' + summary.recordCount + ' normalized records from ' + summary.companyName + '. Shared workspace analysis now uses this dataset. Source status: imported CSV (' + (businessData.dataNature || 'user supplied') + ').', false);
    }
    win.importCSV = function (file) {
      if (!file) return;
      const reader = new win.FileReader();
      reader.onerror = () => show('Could not read this file. Check that it is a valid CSV and try again.', true);
      reader.onload = () => {
        try {
          const result = normalizeBusinessCsv(reader.result);
          if (!result.recognized) {
            if (typeof legacyImport === 'function') return legacyImport.call(this, file);
            return show('Unrecognized CSV format. This importer expects a dataset column for multi-table business files.', true);
          }
          if (result.errors.length) { pending = null; win.document.getElementById('wide-csv-preview')?.remove(); show('CSV validation failed: ' + result.errors.join(' '), true); return; }
          pending = result;
          preview(result, file.name || 'Business data CSV');
          show('CSV format recognized and validated. Review the preview before applying it.', false);
        } catch (error) { show('CSV import failed: ' + (error && error.message ? error.message : 'Unexpected format.'), true); }
        finally { const input = win.document.getElementById('csv-file'); if (input) input.value = ''; }
      };
      reader.readAsText(file);
    };
  }

  return { parseCsv, normalizeBusinessCsv, install };
});
