const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site'),html=fs.readFileSync(path.join(site,'index.html'),'utf8');
let count=0;
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  const src=match[1].match(/src="([^"]+)"/);
  if(src){const file=path.join(site,src[1].split('?')[0]);assert(fs.existsSync(file),`Missing asset: ${file}`);new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});}
  else new vm.Script(match[2],{filename:`inline-${++count}`});
}
const importer=require('../site/demo-csv-import.js');
const demo=fs.readFileSync(path.join(root,'demo-data/CashFlow_AI_Judges_Demo_2026-11-03.csv'),'utf8');
const result=importer.normalizeBusinessCsv(demo);assert.equal(result.recognized,true);assert.deepEqual(result.errors,[]);assert.deepEqual(result.warnings,[]);assert.equal(result.summary.skipped,0);
console.log(`PASS: ${count} inline scripts, all referenced assets, and demo CSV (${result.summary.recordCount} imported records).`);
