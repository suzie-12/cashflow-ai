'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { generate, exportRows, toCsv, dataDictionary } = require('./demo-dataset.js');

const destination = path.join(__dirname, 'demo-data');
fs.mkdirSync(destination, { recursive: true });
const asOf = process.argv[2] || require('./demo-dataset.js').defaultAsOf;
for (const condition of ['stable', 'risk', 'growth']) {
  const data = generate(condition, { today: asOf });
  const rows = exportRows(data);
  const file = path.join(destination, `abc-lifestyle-store-${condition}-simulated-demo.csv`);
  fs.writeFileSync(file, `\uFEFF${toCsv(rows)}`, 'utf8');
  console.log(`${path.basename(file)} · ${rows.length} rows`);
}
fs.writeFileSync(path.join(destination, 'data-dictionary.md'), dataDictionary(), 'utf8');
console.log(`data-dictionary.md · 90 historical days · 30 forecast days · as of ${asOf}`);
