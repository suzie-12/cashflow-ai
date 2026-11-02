(() => {
  'use strict';
  function install() {
  const E=id=>document.getElementById(id), modal=E('hub-modal');
  if(!modal)return;
  const ids=['f-type','f-currency','f-cash','f-period','f-safe','f-receipts','f-ar','f-expenses','f-suppliers','d-cash','detail-rows'];
  const cashTypes=new Set(['receipt','expense','supplier','inventory']);
  const businessTypes=['Retail store','SME Retail · Online & Offline','E-commerce','Wholesale & Distribution','Restaurant & Cafe','Food & Beverage Production','Manufacturing','Construction & Renovation','Professional Services','Consulting','Technology & Software','Healthcare & Wellness','Education & Training','Logistics & Transportation','Hospitality & Tourism','Real Estate & Property Management','Agriculture & Farming','Creative & Marketing Agency','Personal & Home Services','Nonprofit & Social Enterprise'];
  const typePicker=document.createElement('select');typePicker.id='sc-business-type';typePicker.setAttribute('aria-label','Choose a business type');typePicker.setAttribute('data-i18n-ignore','');
  typePicker.add(new Option('Choose a business type…',''));
  businessTypes.forEach(type=>typePicker.add(new Option(type,type)));
  typePicker.add(new Option('Other / Custom type','__custom'));
  E('f-type').before(typePicker);
  E('f-type').placeholder='Or enter your own business type';
  E('f-type').setAttribute('aria-label','Business type — editable');
  const typeHint=document.createElement('small');typeHint.textContent='Choose an industry above, or enter your own type below.';typeHint.setAttribute('data-i18n-ignore','');typePicker.before(typeHint);
  const syncType=()=>{const value=E('f-type').value;typePicker.value=businessTypes.includes(value)?value:value?'__custom':''};
  typePicker.onchange=()=>{if(!typePicker.value)return;if(typePicker.value==='__custom'){E('f-type').value='';E('f-type').focus()}else E('f-type').value=typePicker.value;E('f-type').removeAttribute('aria-invalid')};
  E('f-type').addEventListener('input',syncType);
  let base=null, initial=null, busy=false;
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const add=(date,n)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const read=()=>Object.fromEntries(ids.map(id=>[id,E(id).value]));
  const write=values=>{ids.forEach(id=>{if(values[id]!=null)E(id).value=values[id];E(id).removeAttribute('aria-invalid')});syncType()};
  const message=(text,error=false)=>{const box=E('hub-validation');box.textContent=text;box.classList.toggle('sc-input-error',error);box.setAttribute('role',error?'alert':'status')};
  const currency=E('f-currency');
  ['SGD','GBP','HKD','AUD','CAD','JPY'].forEach(code=>currency.add(new Option(code,code)));
  function populate(d){
    if(d.currency&&!Array.from(currency.options).some(o=>o.value===d.currency))currency.add(new Option(d.currency,d.currency));
    write({'f-type':d.businessType||'','f-currency':d.currency||'SGD','f-cash':d.cash??0,'f-period':d.period||30,'f-safe':d.safe??0,'d-cash':d.cash??0,'f-receipts':''});
    const rows=(d.records||[]).filter(r=>r.date>=today()),line=r=>[Math.round((new Date(r.date+'T12:00:00')-new Date(today()+'T12:00:00'))/86400000),r.amount,r.description].join(', ');
    E('f-ar').value=rows.filter(r=>r.type==='receipt').map(line).join('\n');
    E('f-expenses').value=rows.filter(r=>r.type==='expense').map(line).join('\n');
    E('f-suppliers').value=rows.filter(r=>r.type==='supplier'||r.type==='inventory').map(line).join('\n');
    E('detail-rows').value=(d.records||[]).map(r=>[r.date,r.type,r.description,r.amount].join(',')).join('\n');
  }
  const footer=E('hub-validation').nextElementSibling;
  footer.className='scenario-footer';footer.setAttribute('data-i18n-ignore','');
  footer.innerHTML='<div class="scenario-footer-copy"><b>Ready when you are</b><small>We check your entries automatically before running.</small></div><div class="scenario-footer-actions"><button type="button" class="btn" id="sc-example">Try sample data</button><details id="sc-more"><summary class="btn">More options ▾</summary><div class="sc-more-menu"><button type="button" id="sc-save">Save draft in this browser</button><button type="button" id="sc-restore">Restore saved draft</button><button type="button" id="sc-reset">Undo form changes</button></div></details><button type="button" class="btn primary" id="sc-run">Check &amp; Run Analysis →</button></div>';
  E('hub-validation').setAttribute('data-i18n-ignore','');
  const guide=document.createElement('div');guide.className='scenario-guide';guide.setAttribute('data-i18n-ignore','');guide.textContent='1. Enter your cash and upcoming payments.  2. Click Check & Run Analysis. No separate validation step is needed.';
  E('quick-form').before(guide);
  E('f-receipts').closest('label').hidden=true;
  E('f-ar').closest('label').childNodes[0].textContent='Customer payments expected ';
  const help=E('f-ar').closest('label').querySelector('small');help.textContent='One payment per line: days from today, amount, description. Example: 15, 5000, Customer invoice';
  ['f-ar','f-expenses','f-suppliers'].forEach(id=>{E(id).placeholder='15, 5000, Payment description';E(id).spellcheck=false});
  const open=window.openDemoInput;
  window.openDemoInput=()=>{open();base=structuredClone(window.businessData);populate(base);initial=read();message('Edit the upcoming payments below, then click Check & Run Analysis. Historical records are kept.');};
  const mode=window.setDemoMode;
  window.setDemoMode=detail=>{mode(detail);E('tabquick').classList.toggle('primary',!detail);E('tabdetail').classList.toggle('primary',detail);E('tabquick').setAttribute('aria-pressed',String(!detail));E('tabdetail').setAttribute('aria-pressed',String(detail));};
  const key=r=>JSON.stringify([r.date,r.type,r.description,+r.amount]);
  function validate(){
    modal.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));
    const fail=(id,text)=>{E(id).setAttribute('aria-invalid','true');E(id).focus();throw Error(text)};
    if(!E('f-type').value.trim())fail('f-type','Enter your business type, for example Retail store.');
    if(!currency.value)fail('f-currency','Choose a currency.');
    const detail=!E('detail-form').hidden,cashId=detail?'d-cash':'f-cash';
    for(const id of [cashId,'f-safe'])if(E(id).value.trim()===''||!Number.isFinite(+E(id).value)||+E(id).value<0)fail(id,'Enter a cash amount of zero or more.');
    const period=+E('f-period').value;if(!Number.isInteger(period)||period<1)fail('f-period','Choose a forecast period.');
    let rows=[];
    const parseLine=(id,line,index,type)=>{
      const a=line.split(',').map(v=>v.trim());let date,description,amount;
      if(detail){date=a.shift();type=(a.shift()||'').toLowerCase();amount=Number(a.pop());description=a.join(', ');if(!/^\d{4}-\d\d-\d\d$/.test(date)||Number.isNaN(Date.parse(date))||add(date,0)!==date)fail(id,`Line ${index+1}: enter a valid date as YYYY-MM-DD.`);}
      else {const days=a.shift(),value=a.shift();if(!/^-?\d+$/.test(days))fail(id,`Line ${index+1}: start with a whole number of days, for example 15, 5000, Customer invoice.`);date=add(today(),+days);amount=Number(value);description=a.join(', ');}
      if(!Number.isFinite(amount)||amount<=0)fail(id,`Line ${index+1}: enter an amount greater than zero, without thousands separators.`);
      if(!description)fail(id,`Line ${index+1}: add a short payment description.`);
      if(!cashTypes.has(type)&&!['revenue','cogs','opex','overdue_receivable'].includes(type))fail(id,`Line ${index+1}: use receipt, expense, supplier, inventory, revenue, cogs, opex or overdue_receivable.`);
      let record={date,type,description,amount};
      const existing=(base.records||[]).find(r=>key(r)===key(record)||(type==='supplier'&&r.type==='inventory'&&r.date===date&&+r.amount===amount&&r.description===description));
      return existing?structuredClone(existing):record;
    };
    if(detail)rows=E('detail-rows').value.split(/\r?\n/).filter(l=>l.trim()).map((l,i)=>parseLine('detail-rows',l,i));
    else {for(const [id,type] of [['f-ar','receipt'],['f-expenses','expense'],['f-suppliers','supplier']])rows.push(...E(id).value.split(/\r?\n/).filter(l=>l.trim()).map((l,i)=>parseLine(id,l,i,type)));rows=[...(base.records||[]).filter(r=>!cashTypes.has(r.type)||r.date<today()),...rows];}
    if(!rows.length)fail(detail?'detail-rows':'f-ar','Add at least one payment, or choose Try sample data.');
    return {...base,businessType:E('f-type').value.trim(),currency:currency.value,cash:+E(cashId).value,safe:+E('f-safe').value,period,records:rows,source:'manual',updated:new Date().toLocaleString('en-GB')};
  }
  E('sc-example').onclick=()=>{base=window.CashFlowDemoData.generate('stable',{today:today()}).businessData;populate(base);message('Sample data is ready to edit. Click Check & Run Analysis to apply it.');};
  E('sc-reset').onclick=()=>{base=structuredClone(window.businessData);write(initial);E('sc-more').open=false;message('Form changes undone. Your active business data has not changed.');};
  E('sc-save').onclick=()=>{try{localStorage.setItem('cashflow-scenario-draft-v1',JSON.stringify({values:read(),base,detail:!E('detail-form').hidden}));message('Draft saved in this browser. Your active analysis has not changed.');}catch{message('Could not save the draft. Browser storage may be full.',true)}E('sc-more').open=false;};
  E('sc-restore').onclick=()=>{try{const d=JSON.parse(localStorage.getItem('cashflow-scenario-draft-v1')||'null');if(!d){message('No saved draft yet. Choose Save draft first.');return}base=d.base;populate(base);write(d.values);window.setDemoMode(d.detail);message('Saved draft restored. Review it, then click Check & Run Analysis.');}catch{message('The saved draft could not be opened.',true)}finally{E('sc-more').open=false}};
  E('sc-run').onclick=async()=>{
    if(busy)return;busy=true;const button=E('sc-run');button.disabled=true;button.textContent='Checking your data…';
    try{
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const data=validate();window.businessData=data;window.__cashFlowDemoScenarioActive=false;
      if(window.demoCompanyData)window.demoCompanyData.businessData=data;
      window.updateDemoPages?.();
      window.dispatchEvent(new CustomEvent('business-data-updated',{detail:{source:'manual'}}));
      window.closeDemoInput();window.go('agent');
      setTimeout(()=>window.runDsoAnalysis?.(),0);
    }catch(error){message(error.message||'Please check your entries and try again.',true)}
    finally{busy=false;button.disabled=false;button.textContent='Check & Run Analysis →';}
  };
  modal.addEventListener('keydown',e=>{if(e.key==='Escape'){E('sc-more').open=false;window.closeDemoInput();}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();E('sc-run').click();}});
  const style=document.createElement('style');style.textContent=`#hub-modal .hubdialog{max-height:92vh;overflow:auto;scroll-padding:30px}#hub-modal .scenario-guide{padding:12px 14px;background:#eef7f8;border:1px solid #d5e9eb;color:#356173;border-radius:8px;margin:14px 0;font-size:12px;line-height:1.7}#hub-modal textarea{font:12px/1.7 'DM Sans',sans-serif;min-height:115px}#hub-modal .scenario-footer{position:sticky;bottom:-1px;z-index:2;background:#fff;padding:16px 0 8px;border-top:1px solid #e1e8ed;display:flex;justify-content:space-between;gap:16px;align-items:center;box-shadow:0 -10px 18px #fff}#hub-modal .scenario-footer-copy{display:grid;gap:4px;font-size:12px}#hub-modal .scenario-footer-copy small{color:#718497;font-size:11px}#hub-modal .scenario-footer-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#hub-modal .scenario-footer .btn{min-height:44px;padding:10px 14px;font-size:12px;touch-action:manipulation}#hub-modal .scenario-footer .primary{min-width:210px}#sc-more{position:relative}#sc-more summary{list-style:none;cursor:pointer}#sc-more summary::-webkit-details-marker{display:none}.sc-more-menu{position:absolute;bottom:55px;right:0;width:235px;padding:6px;background:white;border:1px solid #dce5ea;border-radius:9px;box-shadow:0 8px 30px #20364825}.sc-more-menu button{display:block;width:100%;text-align:left;border:0;background:white;border-radius:5px;padding:12px;color:#304e60;font-size:12px}.sc-more-menu button:hover{background:#eef6f7}#hub-modal [aria-invalid=true]{border:2px solid #bd5e55}#hub-modal .sc-input-error{border-color:#bd5e55;background:#fff4f2;color:#9b4038}#hub-modal button:focus-visible,#hub-modal summary:focus-visible{outline:3px solid #78bdc8;outline-offset:2px}#hub-modal button:disabled{opacity:.65;cursor:wait}@media(max-width:760px){#hub-modal .scenario-footer{flex-direction:column;align-items:stretch}#hub-modal .scenario-footer-actions{display:grid;grid-template-columns:1fr 1fr}#hub-modal #sc-run{grid-column:1/-1}#hub-modal .scenario-footer-copy{display:none}}`;
  style.textContent += '#hub-modal label[hidden]{display:none!important}#hub-modal .scenario-footer{display:grid;grid-template-columns:1fr;gap:10px}#hub-modal .scenario-footer-actions{justify-content:flex-end}';
  document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
