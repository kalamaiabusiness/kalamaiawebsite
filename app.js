/* Kalamaia customer registration, order submission and tracking.
   Reads use JSONP; customer/order writes use a hidden form POST to Apps Script. */
const CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbyMeRlzGlvvwTm7e1XxHBlaZLVYa6_m0oSLnzNrHD2Bb8FCHnVSJfHrukk19FBxdXNr/exec",
  currency: "IDR"
};
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:CONFIG.currency,maximumFractionDigits:0}).format(Number(n)||0);
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
$("#year").textContent = new Date().getFullYear();
const backdrop=$("#modalBackdrop"), content=$("#modalContent"), title=$("#modalTitle"), subtitle=$("#modalSubtitle");
let activeView = "register";
let registrationNeedsCopy = false;
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$$('[data-open]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();openModal(b.dataset.open);$("#mainNav").classList.remove("open")}));
$("#modalClose").addEventListener("click",closeModal);
backdrop.addEventListener("click",e=>{if(e.target===backdrop && !registrationNeedsCopy)closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape" && !registrationNeedsCopy)closeModal()});
function openModal(view){backdrop.hidden=false;document.body.style.overflow="hidden";renderView(view);$("#modalClose").focus()}
function closeModal(){if(registrationNeedsCopy){showCopyRequiredMessage();return}backdrop.hidden=true;document.body.style.overflow="";content.innerHTML=""}
function showCopyRequiredMessage(){const note=$("#copyReminder");if(note){note.textContent="Please copy your customer ID before closing this window. Keep it safe for future orders and tracking.";note.hidden=false}}
function renderView(view){
  activeView=view;
  const views={
    register:["Create customer ID","Enter your contact details and full delivery address.",registerForm],
    order:["Place an order","Your customer ID is required before you can submit an order.",orderForm],
    track:["Track my order","Enter your customer ID and order reference.",trackForm],
    support:["Order support","Check your order reference and contact the Kalamaia team if you need help.",supportInfo]
  };
  [title.textContent,subtitle.textContent]=views[view].slice(0,2);content.innerHTML=views[view][2]();
  if(view==="register") $("#registerForm").addEventListener("submit",registerCustomer);
  if(view==="order") setupOrderForm();
  if(view==="track") $("#trackForm").addEventListener("submit",trackOrder);
}
function currentCustomer(){try{return JSON.parse(localStorage.getItem("kalamaiaCustomer")||"null")}catch{return null}}
function registerForm(){return `<form id="registerForm"><div class="field"><label for="customerName">Full name *</label><input id="customerName" name="name" required maxlength="80" autocomplete="name" placeholder="e.g. Agung Barus"></div><div class="field"><label for="whatsapp">WhatsApp number *</label><input id="whatsapp" name="whatsapp" required type="tel" inputmode="tel" maxlength="25" autocomplete="tel" placeholder="e.g. 08123456789"></div><div class="field"><label for="streetAddress">Street / house / building address *</label><textarea id="streetAddress" name="streetAddress" required maxlength="300" autocomplete="street-address" placeholder="Street name, house number, RT/RW, kelurahan"></textarea></div><div class="form-grid"><div class="field"><label for="kecamatan">Kecamatan *</label><input id="kecamatan" name="kecamatan" required maxlength="100" placeholder="e.g. Ilir Timur I"></div><div class="field"><label for="postalCode">Kode Pos *</label><input id="postalCode" name="postalCode" required inputmode="numeric" maxlength="10" placeholder="e.g. 30114"></div><div class="field"><label for="city">City / Regency *</label><input id="city" name="city" required maxlength="100" autocomplete="address-level2" placeholder="e.g. Palembang"></div><div class="field"><label for="province">Province *</label><input id="province" name="province" required maxlength="100" autocomplete="address-level1" placeholder="e.g. Sumatera Selatan"></div></div><button class="button button-dark form-submit" type="submit">Generate customer ID <span>→</span></button><div id="formMessage" aria-live="polite"></div></form><p class="privacy-note">Your customer ID uses the first and third characters of your first name plus the last four digits of your WhatsApp number (for example, Dita + 2548 = DT2548). Keep it for future orders.</p>`}
function bookOrderRowHtml(index){
  return `<div class="book-order-row result-card" data-book-row>
    <div class="book-row-heading"><h3>Book ${index}</h3>${index>1?'<button class="inline-button remove-book-row" type="button">Remove</button>':''}</div>
    <div class="form-grid">
      <div class="field"><label>ISBN</label><input data-field="isbn" maxlength="30" placeholder="ISBN (if available)"></div>
      <div class="field"><label>Title *</label><input data-field="title" required maxlength="250" placeholder="Book title"></div>
      <div class="field"><label>Author</label><input data-field="author" maxlength="150" placeholder="Author name"></div>
      <div class="field"><label>Format *</label><select data-field="format" required><option value="">Choose format</option><option>Paperback</option><option>Hardcover</option><option>E-book</option><option>Other</option></select></div>
      <div class="field"><label>Source / store</label><input data-field="source" maxlength="120" placeholder="If known"></div>
      <div class="field"><label>Quantity *</label><input data-field="qty" type="number" min="1" max="999" step="1" value="1" required></div>
      <div class="field"><label>Unit Price (Rp, if known)</label><input data-field="unitPrice" type="number" min="0" max="1000000000" step="1000" placeholder="Enter price if known"></div>
    </div>
  </div>`;
}
function orderForm(){
  const c=currentCustomer();
  return `<form id="orderForm">
    ${c?`<div class="notice">Ordering as <b>${esc(c.name)}</b> · Customer ID: <b>${esc(c.customerId)}</b> <button class="inline-button" type="button" id="changeCustomer">Change customer</button></div>`:`<div class="notice">You need a customer ID first. <button class="inline-button" type="button" id="registerFirst">Register now</button></div>`}
    <p class="privacy-note">Each book will be saved as a separate row in Kalamaia Orders. Your customer ID is added automatically. Fill in the eight fields shown in the form. Leave ISBN, Source, or Unit Price blank if unknown.</p>
    <div id="bookOrderRows">${bookOrderRowHtml(1)}</div>
    <button class="button button-light form-submit" id="addBookRow" type="button">+ Add another book</button>
    <button class="button button-dark form-submit" type="submit" ${c?"":"disabled"}>Submit order <span>→</span></button><div id="formMessage" aria-live="polite"></div>
  </form>`;
}
function trackForm(){return `<form id="trackForm"><div class="field"><label for="trackCustomerId">Customer ID *</label><input id="trackCustomerId" name="customerId" required maxlength="60" placeholder="e.g. Agung6789" autocomplete="off" value="${esc(currentCustomer()?.customerId||"")}"></div><div class="field"><label for="orderId">Order reference *</label><input id="orderId" name="orderId" required maxlength="40" placeholder="e.g. KM-20261027-A1B2C3" autocomplete="off"></div><button class="button button-dark form-submit" type="submit">Track order <span>→</span></button><div id="formMessage" aria-live="polite"></div></form><p class="privacy-note">Use both values from your order confirmation. Tracking does not show your full address or WhatsApp number.</p>`}
function supportInfo(){return `<div class="result-card"><h3>Need help with an order?</h3><p>Use Track my order to check the latest status. If the order details are incorrect, contact the Kalamaia team through your usual support channel and share your order reference.</p><button class="button button-light form-submit" id="supportTrack" type="button">Track an order →</button></div>`}
function showMessage(message,error=false){const el=$("#formMessage");if(el){el.className=error?"notice error":"notice";el.textContent=message}}
function jsonp(action,payload={}){
  return new Promise((resolve,reject)=>{
    const callbackName="kalamaiaJsonp_"+Date.now()+"_"+Math.floor(Math.random()*100000);
    const script=document.createElement("script");
    const timer=setTimeout(()=>{cleanup();reject(new Error("Request timed out. Check that the Apps Script web app is deployed and accessible."));},18000);
    function cleanup(){clearTimeout(timer);delete window[callbackName];script.remove()}
    window[callbackName]=data=>{cleanup();if(!data||data.ok===false)reject(new Error(data?.error||"Request failed."));else resolve(data)};
    script.onerror=()=>{cleanup();reject(new Error("Could not reach the Apps Script backend. Check its deployment URL and access settings."))};
    const url=new URL(CONFIG.apiUrl);url.searchParams.set("action",action);url.searchParams.set("callback",callbackName);
    Object.entries(payload).forEach(([k,v])=>url.searchParams.set(k,String(v??"")));
    script.src=url.toString();document.head.appendChild(script);
  });
}
function postToAppsScript(action,payload){
  return new Promise((resolve,reject)=>{
    const nonce="km_"+Date.now()+"_"+Math.random().toString(36).slice(2);
    const iframe=document.createElement("iframe");iframe.name="kalamaia_post_"+nonce;iframe.style.display="none";iframe.setAttribute("aria-hidden","true");
    const form=document.createElement("form");form.method="POST";form.action=CONFIG.apiUrl;form.target=iframe.name;form.style.display="none";
    const values={action,payload:JSON.stringify(payload),nonce};
    Object.entries(values).forEach(([name,value])=>{const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;form.appendChild(input)});
    const timer=setTimeout(()=>finish(new Error("The request timed out. Check the Apps Script deployment and try again.")),20000);
    function onMessage(event){const d=event.data;if(!d||d.type!=="kalamaia-response"||d.nonce!==nonce)return;finish(null,d.payload)}
    function finish(err,result){clearTimeout(timer);window.removeEventListener("message",onMessage);form.remove();iframe.remove();if(err)reject(err);else if(!result||result.ok===false)reject(new Error(result?.error||"The request could not be saved."));else resolve(result)}
    window.addEventListener("message",onMessage);document.body.append(iframe,form);form.submit();
  });
}
async function registerCustomer(e){
  e.preventDefault();const f=new FormData(e.currentTarget);const name=String(f.get("name")||"").trim(),whatsapp=String(f.get("whatsapp")||"").trim();const streetAddress=String(f.get("streetAddress")||"").trim(),kecamatan=String(f.get("kecamatan")||"").trim(),city=String(f.get("city")||"").trim(),province=String(f.get("province")||"").trim(),postalCode=String(f.get("postalCode")||"").trim();const payload={name,whatsapp,address:[streetAddress,"Kecamatan "+kecamatan,city,province,postalCode].filter(Boolean).join(", ")};
  if(!payload.name||!payload.whatsapp||!streetAddress||!kecamatan||!city||!province||!postalCode){showMessage("Please complete all required fields, including Kecamatan and Kode Pos.",true);return}
  if(payload.whatsapp.replace(/\D/g,"").length<8){showMessage("Please enter a valid WhatsApp number.",true);return}
  const btn=e.currentTarget.querySelector("button[type=submit]");btn.disabled=true;btn.textContent="Generating…";showMessage("Saving your details to the customer sheet…");
  try{const r=await postToAppsScript("registerCustomer",payload);localStorage.setItem("kalamaiaCustomer",JSON.stringify({customerId:r.customerId,name:payload.name}));registrationNeedsCopy=true;content.innerHTML=`<div class="notice">Customer ID created successfully. This screen will stay open until you copy your ID.</div><div class="result-card customer-id-result"><h3>Your Kalamaia customer ID</h3><p class="customer-id-value" id="generatedCustomerId">${esc(r.customerId)}</p><p>Copy and save this ID. You will need it for future orders and tracking.</p><button class="button button-dark form-submit" id="copyCustomerId" type="button">Copy customer ID</button><p id="copyReminder" class="copy-reminder" aria-live="polite" hidden></p><button class="button button-light form-submit continue-after-copy" id="continueOrder" type="button" disabled>Copy your ID to continue →</button></div>`;$("#copyCustomerId").onclick=async()=>{const id=r.customerId;let copied=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(id);copied=true}}catch(_){}if(!copied){const temp=document.createElement("textarea");temp.value=id;temp.setAttribute("readonly","");temp.style.position="fixed";temp.style.opacity="0";document.body.appendChild(temp);temp.select();try{copied=document.execCommand("copy")}catch(_){}temp.remove()}if(copied){registrationNeedsCopy=false;const copyBtn=$("#copyCustomerId");copyBtn.textContent="Copied! ✓";copyBtn.disabled=true;$("#continueOrder").disabled=false;$("#continueOrder").textContent="Continue to order →";$("#copyReminder").hidden=true;const message=document.createElement("div");message.className="notice";message.textContent="Customer ID copied. You can now continue to your order.";copyBtn.insertAdjacentElement("afterend",message)}else{const reminder=$("#copyReminder");reminder.hidden=false;reminder.textContent="Automatic copying was blocked by your browser. Select the ID above and copy it manually, then click Continue to order.";const selection=document.createRange();selection.selectNodeContents($("#generatedCustomerId"));const sel=window.getSelection();sel.removeAllRanges();sel.addRange(selection);registrationNeedsCopy=false;$("#continueOrder").disabled=false;$("#continueOrder").textContent="I have saved my ID — continue →"}};$("#continueOrder").onclick=()=>{if(registrationNeedsCopy){showCopyRequiredMessage();return}renderView("order")};}
  catch(err){btn.disabled=false;btn.innerHTML='Generate customer ID <span>→</span>';showMessage(err.message,true)}
}
function setupOrderForm(){
  const c=currentCustomer(),reg=$("#registerFirst"),change=$("#changeCustomer");
  if(reg)reg.onclick=()=>renderView("register");
  if(change)change.onclick=()=>renderView("register");
  const form=$("#orderForm");
  if(form){
    form.addEventListener("submit",submitOrder);
    $("#addBookRow").addEventListener("click",()=>{
      const rows=$("#bookOrderRows");
      const next=rows.querySelectorAll("[data-book-row]").length+1;
      rows.insertAdjacentHTML("beforeend",bookOrderRowHtml(next));
    });
    $("#bookOrderRows").addEventListener("click",e=>{
      const btn=e.target.closest(".remove-book-row");
      if(!btn)return;
      btn.closest("[data-book-row]").remove();
      $("#bookOrderRows").querySelectorAll("[data-book-row] h3").forEach((h,i)=>h.textContent="Book "+(i+1));
    });
  }
}
async function submitOrder(e){
  e.preventDefault();
  const c=currentCustomer();
  if(!c?.customerId){showMessage("Please create your customer ID before ordering.",true);return}
  const rows=[...$("#bookOrderRows").querySelectorAll("[data-book-row]")];
  const items=rows.map((row,i)=>{
    const val=key=>String(row.querySelector(`[data-field="${key}"]`)?.value||"").trim();
    return {isbn:val("isbn"),title:val("title"),author:val("author"),format:val("format"),source:val("source"),
      qty:Number(val("qty")||1),unitPrice:val("unitPrice")};
  });
  if(!items.length||items.some(x=>!x.title||!x.format||!Number.isInteger(x.qty)||x.qty<1||x.qty>999)){
    showMessage("Please provide a title, format, and valid quantity for every book.",true);return;
  }
  const payload={customerId:c.customerId,items};
  const btn=e.currentTarget.querySelector('button[type="submit"]');
  btn.disabled=true;btn.textContent="Submitting…";showMessage("Saving your book order…");
  try{
    const r=await postToAppsScript("submitOrder",payload);
    content.innerHTML=`<div class="notice">Your order has been saved to Kalamaia Orders and prepared for tracking.</div><div class="result-card"><h3>Order received</h3><p>Order reference</p><p style="font-size:21px;font-weight:800;color:#20251f">${esc(r.orderId)}</p><p>Customer ID: <b>${esc(r.customerId)}</b></p><p>Books in this order: <b>${esc(r.itemCount)}</b></p><p>Status: <span class="status-pill">${esc(r.status||"Order received")}</span></p><p>Save both the order reference and your customer ID to track this order.</p><button class="button button-dark form-submit" id="trackNewOrder" type="button">Track this order →</button></div>`;
    $("#trackNewOrder").onclick=()=>{renderView("track");$("#orderId").value=r.orderId;$("#trackCustomerId").value=r.customerId};
  }catch(err){btn.disabled=false;btn.innerHTML='Submit order <span>→</span>';showMessage(err.message,true)}
}
async function trackOrder(e){e.preventDefault();const f=new FormData(e.currentTarget);const customerId=String(f.get("customerId")||"").trim();const orderId=String(f.get("orderId")||"").trim();showMessage("Looking up your order…");const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;try{const r=await jsonp("trackOrder",{customerId,orderId});if(!r.order){showMessage("No matching order was found. Check the customer ID and order reference.",true);btn.disabled=false;return}const o=r.order;$("#formMessage").outerHTML=`<div id="trackResult"><div class="result-card"><h3>Order ${esc(o.orderId)}</h3><p><span class="status-pill">${esc(o.status||"Order received")}</span></p><p><b>Submitted:</b> ${esc(o.createdAt||"—")}</p><p><b>Order details:</b> ${esc(o.items||"—")}</p><p><b>Quantity:</b> ${esc(o.quantity||"—")}</p><p><b>Notes:</b> ${esc(o.notes||"—")}</p><p><b>Shipment / tracking:</b> ${esc(o.tracking||"Not added yet")}</p><p><b>Last updated:</b> ${esc(o.updatedAt||"—")}</p></div><button class="button button-light form-submit" id="trackAnother" type="button">Track another order</button></div>`;$("#trackAnother").onclick=()=>renderView("track")}catch(err){showMessage(err.message,true);btn.disabled=false}}
$(document).addEventListener("click",e=>{if(e.target?.id==="supportTrack")openModal("track")});
