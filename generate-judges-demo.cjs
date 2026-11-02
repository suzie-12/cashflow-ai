const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const generator=require('./site/demo-dataset.js');
const importer=require('./site/demo-csv-import.js');
const asOf=process.argv[2] || '2026-11-03';
assert(/^\d{4}-\d{2}-\d{2}$/.test(asOf)&&!Number.isNaN(Date.parse(asOf+'T12:00:00')), 'Provide a valid as-of date in YYYY-MM-DD format.');
const demo=generator.generate('growth',{today:asOf});
// Keep the importer's company, dated cash and financial inputs. Auxiliary export
// families are not consumed by the dashboard importer and need not slow a demo.
const families=new Set(['business_profile','daily_cash_balance','cash_inflow','expense_cash_outflow','business_financial_record']);
const rows=generator.exportRows(demo).filter(r=>families.has(r.dataset));
const cashKey=r=>JSON.stringify([r.date,r.type,r.description,+r.amount]);
const exportedCash=new Set(rows.filter(r=>r.dataset==='cash_inflow'||r.dataset==='expense_cash_outflow').map(cashKey));
for(const r of demo.businessData.records)if(['receipt','expense','supplier','inventory'].includes(r.type)&&!exportedCash.has(cashKey(r)))rows.push({...r,dataset:r.type==='receipt'?'cash_inflow':'expense_cash_outflow'});
const columns=[...new Set(['dataset',...rows.flatMap(r=>Object.keys(r))])];
const csv='\uFEFF'+generator.toCsv(rows,columns)+'\r\n';
const check=importer.normalizeBusinessCsv(csv);
assert.equal(check.recognized,true);assert.deepEqual(check.errors,[]);assert.deepEqual(check.warnings,[]);assert.equal(check.summary.skipped,0);assert.equal(check.summary.completeness,100);
assert.equal(check.businessData.cash,demo.businessData.cash);
assert.equal(check.businessData.safe,demo.businessData.safe);
assert.equal(check.businessData.records.length,demo.businessData.records.length);
for(const row of demo.dailyCash)assert(Math.abs(row.openingBalance+row.cashInflows-row.cashOutflows-row.closingBalance)<0.02);
const dir=path.join(__dirname,'demo-data');fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,`CashFlow_AI_Judges_Demo_${asOf}.csv`);fs.writeFileSync(file,csv,'utf8');
fs.writeFileSync(path.join(dir,'现场演示说明.txt'),`CashFlow AI 评委演示数据\n\n全部数据均为虚构模拟数据，非真实公司或市场数据。\n\n使用文件：CashFlow_AI_Judges_Demo_${asOf}.csv\n公司：ABC Lifestyle Store\n业务：中小零售，线上与线下\n币种：SGD（新加坡元）\n基准日期：${asOf}\n历史范围：${demo.businessData.demoProfile.historicalStart} 至 ${asOf}\n预测范围：${demo.businessData.demoProfile.forecastStart} 至 ${demo.businessData.demoProfile.forecastEnd}\n当前现金：${demo.businessData.cash}\n最低现金储备：${demo.businessData.safe}\n\n现场操作：\n1. 登录网站，进入 Configuration。\n2. 在 Data Hub / Data Preview 中点击 Import CSV，选择本 CSV。\n3. 预览后点击 Use this dataset，才会正式应用数据。\n4. 进入 Dynamic Skill Orchestration，查看分析进度与技能选择。需要重跑时点击 Run Analysis。\n5. 若展示错误恢复，进入 Failure & Recovery Intelligence，点击 Run recovery。该页另行模拟客户回款延迟 15 天，并保留原始公司数据。\n\n建议提前将 CSV 下载到演示电脑。直接导入 CSV 原文件，无需先用 Excel 打开或另存。\n网站预测以浏览器当天日期计算。本文件为 ${asOf} 准备；换日期演示前应重新生成日期适配的数据，以免未来交易变成历史记录。\n\n格式验证：网站原生 normalizeBusinessCsv 已识别；无错误、无警告、无跳过行；必需信息完整度 100%。该完整度仅表示导入所需字段齐全，不代表分析准确性评分。\n`,'utf8');
console.log(JSON.stringify({file,bytes:Buffer.byteLength(csv),rows:rows.length,summary:check.summary},null,2));
