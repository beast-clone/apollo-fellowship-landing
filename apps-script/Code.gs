/**
 * Enquiry endpoint for the Apollo fellowship / Post-MBBS landing page.
 *
 * Receives a JSON POST from apollo-fellowship-landing/index.html and appends
 * one row to the "Apollo Hospitals Programme" sheet. Creates the header row
 * on the first submission, so the sheet can start empty.
 *
 * Deploy: Extensions > Apps Script, paste this file, then
 *   Deploy > New deployment > Web app
 *     Execute as:      Me (praveen@goocampus.in)
 *     Who has access:  Anyone
 * Copy the /exec URL it gives you — that is what the page posts to.
 */

var SHEET_ID   = '1Li3FcJjj_hHDHfK7F6DdK_DTaQgrtxvvXTsH2xplkmI';
var SHEET_NAME = 'Sheet1';
var TIMEZONE   = 'Asia/Kolkata';

/**
 * A web app deployed to "Anyone" is a publicly writable URL. This token keeps
 * out drive-by bots that find the URL on its own. It travels in the page's
 * source, so anyone reading the page can see it — it is noise control, not
 * access control. If the sheet starts collecting junk, change the value here
 * and in LEAD_TOKEN in index.html, then redeploy.
 */
var SHARED_TOKEN = 'gcw-apollo-2026';

/** Sheet column  ->  key in the posted JSON. Order defines column order. */
var COLUMNS = [
  ['Timestamp',        '_timestamp'],
  ['Name',             'name'],
  ['Mobile Number',    'mobile'],
  ['Email',            'email'],
  ['Qualification',    'qualification'],
  ['Area of Interest', 'area_of_interest'],
  ['Current State',    'current_state'],
  ['Looking For',      'looking_for'],
  ['Source',           'source'],
  ['Page URL',         'page_url']
];

var MOBILE_COL = 3; // 1-indexed position of "Mobile Number" above


function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // two submissions at once must not race on appendRow
  } catch (err) {
    return json({ ok: false, error: 'busy' });
  }

  try {
    var raw = (e && e.postData && e.postData.contents) || '{}';
    var body = JSON.parse(raw);

    if (SHARED_TOKEN && body.token !== SHARED_TOKEN) {
      return json({ ok: false, error: 'unauthorised' });
    }

    body._timestamp = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

    var sheet = getSheet();
    ensureHeaders(sheet);

    sheet.appendRow(COLUMNS.map(function (col) {
      var v = body[col[1]];
      return (v === undefined || v === null) ? '' : String(v);
    }));

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


/** Health check — opening the /exec URL in a browser should show ok:true. */
function doGet() {
  return json({ ok: true, service: 'apollo-fellowship-landing enquiry endpoint' });
}


function getSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}


/** Writes and formats the header row once, the first time a lead arrives. */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0) return;

  var headers = COLUMNS.map(function (col) { return col[0]; });
  sheet.getRange(1, 1, 1, headers.length)
       .setValues([headers])
       .setFontWeight('bold')
       .setBackground('#1D417A')
       .setFontColor('#FFFFFF');

  sheet.setFrozenRows(1);

  // keep mobile numbers as typed text rather than letting Sheets make them numeric
  sheet.getRange(2, MOBILE_COL, sheet.getMaxRows() - 1, 1).setNumberFormat('@');

  sheet.autoResizeColumns(1, headers.length);
}


function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Run this once from the Apps Script editor to lay down the header row and
 * a sample lead, so you can see the shape before the page goes live.
 * Delete the sample row afterwards.
 */
function testAppend() {
  var sheet = getSheet();
  ensureHeaders(sheet);
  sheet.appendRow([
    Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
    'Test Doctor', '9876543210', 'test@example.com',
    'MBBS', 'Critical Care', 'Kerala', 'Need help choosing',
    'apollo-fellowship-landing', 'https://example.com/'
  ]);
}
