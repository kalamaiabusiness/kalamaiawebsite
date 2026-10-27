/** Kalamaia order portal backend.
 * Adds/uses two tabs in the configured Google Spreadsheet: Customers and Orders.
 * Existing tabs are not deleted or overwritten.
 */
const CONFIG = {
  SPREADSHEET_ID: '188-HcXMJtjo8AQL_ELk_QMatXXv0pRN6ZE27UJx1SB8',
  CUSTOMER_SHEET: 'Customers',
  ORDER_SHEET: 'Orders'
};

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || 'health');
  let result;
  try {
    if (action === 'trackOrder') {
      result = trackOrder_(String(p.customerId || '').trim(), String(p.orderId || '').trim());
    } else if (action === 'health') {
      result = { ok: true, service: 'Kalamaia order portal', actions: ['registerCustomer (POST)', 'submitOrder (POST)', 'trackOrder (GET)'] };
    } else {
      result = { ok: false, error: 'Unsupported GET action.' };
    }
  } catch (err) {
    result = { ok: false, error: err.message || 'The request could not be completed.' };
  }
  const callback = String(p.callback || '');
  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]{0,100}$/.test(callback)) {
      return ContentService.createTextOutput('/* Invalid callback */').setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const nonce = String(p.nonce || '');
  let result;
  try {
    const action = String(p.action || '');
    const payload = JSON.parse(String(p.payload || '{}'));
    if (action === 'registerCustomer') result = registerCustomer_(payload);
    else if (action === 'submitOrder') result = submitOrder_(payload);
    else result = { ok: false, error: 'Unsupported POST action.' };
  } catch (err) {
    result = { ok: false, error: err.message || 'The request could not be completed.' };
  }
  // The frontend submits a regular HTML form to a hidden iframe, avoiding browser CORS preflight.
  const safeNonce = nonce.replace(/[^A-Za-z0-9_-]/g, '');
  const json = JSON.stringify(result).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body><script>' +
    'window.top.postMessage({type:"kalamaia-response",nonce:' + JSON.stringify(safeNonce) + ',payload:' + json + '},"*");' +
    '</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function registerCustomer_(p) {
  const name = clean_(p.name, 80);
  const whatsapp = clean_(p.whatsapp, 25);
  const address = clean_(p.address, 500);
  const digits = whatsapp.replace(/\D/g, '');
  if (!name || !address || digits.length < 8) throw new Error('Please provide your name, a valid WhatsApp number, and full address.');
  const ss = spreadsheet_();
  const sh = ensureSheet_(ss, CONFIG.CUSTOMER_SHEET, ['Customer ID', 'Name', 'WhatsApp', 'Full Address', 'Created At']);
  const rows = sh.getDataRange().getValues();
  const normalizedPhone = digits;
  for (let i = 1; i < rows.length; i++) {
    const existingDigits = String(rows[i][2] || '').replace(/\D/g, '');
    if (existingDigits === normalizedPhone && String(rows[i][1] || '').trim().toLowerCase() === name.toLowerCase()) {
      return { ok: true, customerId: String(rows[i][0]), existing: true };
    }
  }
  const firstName = (name.split(/\s+/)[0] || 'Customer').replace(/[^A-Za-z0-9]/g, '');
  const base = (firstName || 'Customer') + digits.slice(-4);
  let customerId = base;
  let suffix = 2;
  const ids = new Set(rows.slice(1).map(r => String(r[0] || '').toLowerCase()));
  while (ids.has(customerId.toLowerCase())) {
    customerId = base + '-' + String(suffix).padStart(2, '0');
    suffix++;
  }
  sh.appendRow([customerId, name, whatsapp, address, new Date()]);
  return { ok: true, customerId: customerId, existing: false };
}

function submitOrder_(p) {
  const customerId = clean_(p.customerId, 60);
  const items = clean_(p.items, 2000);
  const quantity = Number(p.quantity || 1);
  const budgetRaw = String(p.budget || '').trim();
  const budget = budgetRaw === '' ? '' : Number(budgetRaw);
  const notes = clean_(p.notes, 1000);
  if (!customerId || !items) throw new Error('Customer ID and order details are required.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new Error('Quantity must be a whole number from 1 to 999.');
  if (budget !== '' && (!Number.isFinite(budget) || budget < 0 || budget > 1000000000)) throw new Error('Please enter a valid estimated budget.');
  const ss = spreadsheet_();
  const customers = ensureSheet_(ss, CONFIG.CUSTOMER_SHEET, ['Customer ID', 'Name', 'WhatsApp', 'Full Address', 'Created At']);
  const customer = findCustomer_(customers, customerId);
  if (!customer) throw new Error('Customer ID was not found. Please register first.');
  const orders = ensureSheet_(ss, CONFIG.ORDER_SHEET, ['Order ID', 'Customer ID', 'Customer Name', 'Items', 'Quantity', 'Estimated Budget (IDR)', 'Notes', 'Status', 'Tracking Reference', 'Created At', 'Updated At']);
  const now = new Date();
  const orderId = newOrderId_(orders, now);
  orders.appendRow([orderId, customerId, customer.name, items, quantity, budget, notes, 'Order received', '', now, now]);
  return { ok: true, orderId: orderId, customerId: customerId, status: 'Order received' };
}

function trackOrder_(customerId, orderId) {
  if (!customerId || !orderId) throw new Error('Customer ID and order reference are required.');
  const ss = spreadsheet_();
  const sh = ss.getSheetByName(CONFIG.ORDER_SHEET);
  if (!sh || sh.getLastRow() < 2) return { ok: true, order: null };
  const rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    const r = rows[i];
    if (String(r[0]).trim().toLowerCase() === orderId.toLowerCase() && String(r[1]).trim().toLowerCase() === customerId.toLowerCase()) {
      return { ok: true, order: {
        orderId: String(r[0]), items: String(r[3] || ''), quantity: r[4], notes: String(r[6] || ''),
        status: String(r[7] || 'Order received'), tracking: String(r[8] || ''),
        createdAt: formatDate_(r[9]), updatedAt: formatDate_(r[10])
      }};
    }
  }
  return { ok: true, order: null };
}

function findCustomer_(sheet, customerId) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === customerId.toLowerCase()) {
      return { customerId: String(rows[i][0]), name: String(rows[i][1] || ''), whatsapp: String(rows[i][2] || ''), address: String(rows[i][3] || '') };
    }
  }
  return null;
}
function newOrderId_(sheet, date) {
  const day = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyyMMdd');
  let id;
  const existing = new Set(sheet.getDataRange().getValues().slice(1).map(r => String(r[0] || '')));
  do { id = 'KM-' + day + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(); } while (existing.has(id));
  return id;
}
function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
  if (!id || id === 'PASTE_SPREADSHEET_ID_HERE') throw new Error('Configure SPREADSHEET_ID in Apps Script first.');
  return SpreadsheetApp.openById(id);
}
function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  else {
    const current = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length)).getValues()[0];
    if (String(current[0] || '') !== headers[0]) throw new Error('The ' + name + ' tab exists but its header row does not match. Rename or clear only that new tab, then try again.');
  }
  sh.setFrozenRows(1);
  return sh;
}
function clean_(value, max) { return String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max); }
function formatDate_(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd MMM yyyy, HH:mm');
}
