const {spawnSync}=require('node:child_process');
const path=require('node:path'),root=path.resolve(__dirname,'..');
for(const script of ['scripts/check.cjs','verify-overview.cjs','verify-recovery.cjs','verify-scenario.cjs','verify-demo-csv.cjs']){
  const result=spawnSync(process.execPath,[script],{cwd:root,stdio:'inherit',env:process.env});
  if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
}
