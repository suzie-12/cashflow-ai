const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const g=require('../site/demo-dataset.js'),importer=require('../site/demo-csv-import.js');
const date=process.argv[2]||'2026-11-03',out=path.resolve(__dirname,'../demo-data');
const families=new Set(['business_profile','daily_cash_balance','cash_inflow','expense_cash_outflow','business_financial_record']);
const key=r=>JSON.stringify([r.date,r.type,r.description,+r.amount]);
for(const state of ['stable','risk','growth']){
 const d=g.generate(state,{today:date}),rows=g.exportRows(d).filter(r=>families.has(r.dataset)),cash=new Set(rows.filter(r=>r.dataset==='cash_inflow'||r.dataset==='expense_cash_outflow').map(key));
 for(const r of d.businessData.records)if(['receipt','expense','supplier','inventory'].includes(r.type)&&!cash.has(key(r)))rows.push({...r,dataset:r.type==='receipt'?'cash_inflow':'expense_cash_outflow'});
 const text='\uFEFF'+g.toCsv(rows)+'\r\n',result=importer.normalizeBusinessCsv(text);
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.warnings,[]);assert.equal(result.summary.skipped,0);assert.equal(result.businessData.records.length,d.businessData.records.length);
 const file=path.join(out,`CashFlow_AI_${state}_${date}.csv`);fs.writeFileSync(file,text);console.log(`${state}: ${result.summary.recordCount} validated records`);
}
