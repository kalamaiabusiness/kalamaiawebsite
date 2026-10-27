/* KALA MAIA — read-only lookup against the existing DB SEP26 sheet.
   Configure apiUrl and demoMode only after deploying the Apps Script backend. */
const CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbwX_k8uad64KW3JVSbgox0PXTfYdKXKMm-0wil9Ag67W4dQDyeFmrjoPltumxApitLq/exec",
  currency: "IDR",
  demoMode: false
};
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:CONFIG.currency,maximumFractionDigits:0}).format(Number(n)||0);
$("#year").textContent = new Date().getFullYear();
const backdrop=$("#modalBackdrop"), content=$("#modalContent"), title=$("#modalTitle"), subtitle=$("#modalSubtitle");
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$$("[data-open]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();openModal(b.dataset.open);$("#mainNav").classList.remove("open")}));
$("#modalClose").addEventListener("click",closeModal);
backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
function openModal(view){backdrop.hidden=false;document.body.style.overflow="hidden";renderView(view);$("#modalClose").focus()}
function closeModal(){backdrop.hidden=true;document.body.style.overflow="";content.innerHTML=""}
function renderView(view){
  const views={
    order:["Order lookup","Enter your customer ID to view matching book records.",lookupForm],
    track:["Find my books","Search the DB SEP26 worksheet by customer ID.",lookupForm],
    support:["Order support","Contact the team if a record looks incorrect.",supportInfo]
  };
  [title.textContent,subtitle.textContent]=views[view].slice(0,2);content.innerHTML=views[view][2]();
  if(view!=="support") $("#lookupForm").addEventListener("submit",lookupCustomer);
}
function lookupForm(){return `<form id="lookupForm"><div class="field"><label for="custId">Customer ID *</label><input id="custId" name="custId" required maxlength="40" placeholder="e.g. SHA5611" autocomplete="off"></div><button class="button button-dark form-submit" type="submit">Find my records <span>→</span></button><div id="formMessage" aria-live="polite"></div></form><p class="privacy-note">Lookup uses customer ID only, as requested. Anyone who knows an ID may be able to view the returned book records; only limited fields are displayed.</p>`}
function supportInfo(){return `<div class="result-card"><h3>Need help with a record?</h3><p>Please contact your KALA MAIA administrator through your usual support channel. This starter does not submit or modify records.</p></div>`}
function api(action,payload={}){
  if(CONFIG.demoMode || !CONFIG.apiUrl) return demoApi(action,payload);
  // Read-only JSONP avoids the common Apps Script cross-origin fetch failure.
  // Only this fixed lookup action is allowed; the callback name is generated locally.
  if(action !== "lookupByCustId") return Promise.reject(new Error("This endpoint supports read-only customer lookup only."));
  return new Promise((resolve,reject)=>{
    const callbackName="kalaMaiaJsonp_"+Date.now()+"_"+Math.floor(Math.random()*100000);
    const script=document.createElement("script");
    const timer=setTimeout(()=>{cleanup();reject(new Error("Lookup timed out. Check the Apps Script deployment and try again."));},15000);
    function cleanup(){clearTimeout(timer);delete window[callbackName];script.remove();}
    window[callbackName]=(data)=>{cleanup();if(!data||data.ok===false)reject(new Error((data&&data.error)||"Lookup failed."));else resolve(data);};
    script.onerror=()=>{cleanup();reject(new Error("Could not reach the Apps Script endpoint. Check that the web app is deployed for the intended access level."));};
    const url=new URL(CONFIG.apiUrl);
    url.searchParams.set("action",action);
    url.searchParams.set("custId",String(payload.custId||""));
    url.searchParams.set("callback",callbackName);
    script.src=url.toString();
    document.head.appendChild(script);
  });
}
function showMessage(message,error=false){const el=$("#formMessage");if(el){el.className=error?"notice error":"notice";el.textContent=message}}
async function lookupCustomer(e){
  e.preventDefault();const custId=String(new FormData(e.currentTarget).get("custId")||"").trim();
  showMessage("Searching DB SEP26…");
  try{
    const r=await api("lookupByCustId",{custId});
    if(!r.records||!r.records.length){showMessage("No records found for that customer ID in DB SEP26.",true);return}
    const rows=r.records.map(x=>`<tr><td>${escapeHtml(x.title)}</td><td>${escapeHtml(x.author)}</td><td>${escapeHtml(x.format)}</td><td>${escapeHtml(x.qty)}</td><td>${money(x.unitPrice)}</td></tr>`).join("");
    const total=r.records.reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.unitPrice)||0),0);
    $("#formMessage").outerHTML=`<div id="lookupResult"><div class="notice">Found ${r.records.length} book record(s) for customer ID <b>${escapeHtml(r.custId)}</b> in DB SEP26.</div><div class="result-card"><h3>Matching records</h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th align="left">Title</th><th align="left">Author</th><th align="left">Format</th><th align="right">Qty</th><th align="right">Unit price</th></tr></thead><tbody>${rows}</tbody></table></div><p style="margin-top:14px"><b>Calculated item value: ${money(total)}</b></p><p>Source: DB SEP26. This total is calculated from quantity × unit price and may not represent final payment due.</p></div><button class="button button-light form-submit" id="lookupAgain">Search another customer</button></div>`;
    $("#lookupAgain").onclick=()=>renderView("track");
  }catch(err){showMessage(err.message,true)}
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function demoApi(action,d){
  await new Promise(r=>setTimeout(r,250));
  if(action==="lookupByCustId" && String(d.custId).toUpperCase()==="SHA5611") return {ok:true,custId:"SHA5611",records:[{title:"Not Quite Dead Yet",author:"Holly Jackson",format:"Paperback",qty:1,unitPrice:208000},{title:"The Wrong Sister",author:"Claire Douglas",format:"Paperback",qty:1,unitPrice:208000},{title:"Pretty Girls",author:"Karin Slaughter",format:"Paperback",qty:1,unitPrice:208000}]};
  if(action==="lookupByCustId") return {ok:true,custId:d.custId,records:[]};
  throw new Error("Unsupported action");
}
