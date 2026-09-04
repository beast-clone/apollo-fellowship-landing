# Wiring the enquiry form to the sheet

Target sheet: **Apollo Hospitals Programme** — `Sheet1`
`https://docs.google.com/spreadsheets/d/1Li3FcJjj_hHDHfK7F6DdK_DTaQgrtxvvXTsH2xplkmI/edit`

The landing page is a static file, so it cannot hold a Google credential.
`Code.gs` runs inside the sheet as your account and does the writing.

---

## Deploy (about two minutes, and only you can do it)

1. Open the sheet → **Extensions → Apps Script**.
2. Delete whatever is in `Code.gs` and paste the contents of [`Code.gs`](Code.gs).
3. **Save** (⌘S).
4. **Deploy → New deployment** → gear icon → **Web app**.
   - Description: `Apollo landing enquiry endpoint`
   - **Execute as:** Me (praveen@goocampus.in)
   - **Who has access:** Anyone ← must be *Anyone*, not "Anyone with Google account"
5. **Deploy**. Google asks you to authorise the script the first time — it needs
   permission to edit the sheet. Click through **Advanced → Go to (project)** if
   the unverified-app screen appears; it is your own script.
6. Copy the **Web app URL**. It ends in `/exec`.
7. Send me that URL and I'll drop it into the page, or paste it yourself into
   `index.html` — search for `LEAD_ENDPOINT` near the top of the `<script>` block.

Check it worked: open the `/exec` URL in a browser. You should see
`{"ok":true,"service":"apollo-fellowship-landing enquiry endpoint"}`.

---

## Columns

The header row is written automatically on the first submission, so the sheet
can stay empty until then. To see the shape sooner, run `testAppend` once from
the Apps Script editor and delete the sample row after.

| # | Column | From the form |
|---|---|---|
| 1 | Timestamp | server time, IST |
| 2 | Name | Name |
| 3 | Mobile Number | Mobile, normalised to 10 digits, stored as text |
| 4 | Email | Email |
| 5 | Qualification | MBBS / MD, MS, DNB / Other PG Qualification |
| 6 | Area of Interest | speciality dropdown |
| 7 | Current State | state dropdown |
| 8 | Looking For | Fellowship / Post-MBBS Certification Programme / Need help choosing |
| 9 | Source | `apollo-fellowship-landing` |
| 10 | Page URL | page the enquiry came from |

To add or reorder columns, edit the `COLUMNS` array in `Code.gs` and redeploy
(**Deploy → Manage deployments → edit → New version**). Existing rows are not
rewritten, so add new columns at the end.

---

## Things worth knowing

- **The URL is publicly writable.** That is what "Who has access: Anyone" means,
  and it is required — visitors are not signed in to Google. `SHARED_TOKEN` in
  `Code.gs` filters out bots that stumble onto the URL, but the token is visible
  in the page source, so it is noise control rather than access control. If junk
  rows start appearing, change the token in both `Code.gs` and `index.html`, then
  redeploy.
- **Redeploy after every script edit.** Saving alone does not update the live
  endpoint — you need Manage deployments → New version, or the page keeps hitting
  the old code.
- **The page posts as `text/plain`.** That is deliberate: it keeps the request a
  CORS "simple request" so the browser skips the preflight that Apps Script
  cannot answer. The script parses the body as JSON regardless.
- **If a submission fails**, the visitor sees an error and is asked to try again;
  nothing is silently dropped. Failures are also logged to the browser console.
