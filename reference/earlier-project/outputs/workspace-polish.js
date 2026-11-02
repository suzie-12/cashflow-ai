(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .content{padding:20px clamp(14px,2vw,26px) 26px}
    .content>.section>.heading{margin-bottom:17px}
    .content .grid{gap:13px}
    .content .card{padding:16px 18px;border:1px solid #e7edf0;border-radius:12px;box-shadow:none}
    .content .card>.title{margin-bottom:9px}
    .content .card>.title h2{font-size:16px;line-height:1.35;color:#17334a}
    .content .card>.title p{margin-top:3px;color:#758595;font-size:10px;line-height:1.5}
    .content .metric label{font-size:10px;letter-spacing:.01em}
    .content .metric strong{font-size:24px;line-height:1.2}
    .content .metric small{font-size:9px;line-height:1.45}
    .content .dso-detail-section,.content .risk-section,.content .mi-section,.content .fd-section,.content .sc-section,.content .ds-section{margin-top:14px}
    .content .dso-insight-panel,.content .dso-decision,.content .sc-recommend,.content .risk-action,.content .mi-note{line-height:1.55}
    .content .dso-insight-panel p,.content .sc-recommend p,.content .risk-action p,.content .mi-note p{font-size:11px;line-height:1.55}
    .workspace-disclosure{margin:6px 0 0;border-top:1px solid #edf1f3;color:#687b8b;font-size:10px;line-height:1.55}
    .workspace-disclosure summary{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:7px 0;cursor:pointer;list-style:none}
    .workspace-disclosure summary::-webkit-details-marker{display:none}
    .workspace-disclosure summary span{min-width:0;color:#5b7081}
    .workspace-disclosure summary b{flex:none;color:#168b95;font-size:9px;font-weight:650}
    .workspace-disclosure[open] summary{border-bottom:1px solid #edf1f3}
    .workspace-disclosure .workspace-full-copy{padding:8px 0;color:#6c7f8f}
    .workspace-disclosure .workspace-full-copy p{margin:0;font-size:10px;line-height:1.6}
    @media(max-width:640px){.content{padding:12px 10px 22px}.content .card{padding:14px}.content .grid{gap:9px}.content .metric strong{font-size:21px}}
  `;
  function init(){
    document.head.appendChild(style);
    const selectors=['.dso-detail-section p','.risk-section p','.mi-section p','.fd-section p','.sc-section p','.ds-section p','.fc-panel p','#overview .card p','#agent .card p','#cash .card p','#expenses .card p','#configuration .card p'].join(',');
    function compact(root=document){const candidates=root.matches?.(selectors)?[root,...root.querySelectorAll(selectors)]:root.querySelectorAll?.(selectors)||[];for(const p of candidates){if(!(p instanceof HTMLElement)||p.dataset.workspaceCompact||p.closest('details.workspace-disclosure'))continue;const fullText=(p.innerText||p.textContent||'').replace(/\s+/g,' ').trim();if(fullText.length<240)continue;p.dataset.workspaceCompact='1';const summaryText=fullText.slice(0,132).replace(/\s+\S*$/,'')+'…';const details=document.createElement('details');details.className='workspace-disclosure';const summary=document.createElement('summary'),label=document.createElement('span'),more=document.createElement('b'),copy=document.createElement('div');label.textContent=summaryText;more.textContent='Details';summary.append(label,more);copy.className='workspace-full-copy';while(p.firstChild)copy.appendChild(p.firstChild);details.append(summary,copy);p.replaceWith(details);details.addEventListener('toggle',()=>{more.textContent=details.open?'Less':'Details'})}}
    const root=document.querySelector('.content');if(!root)return;compact(root);const observer=new MutationObserver(()=>compact(root));observer.observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
