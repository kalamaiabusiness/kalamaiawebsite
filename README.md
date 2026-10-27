# Kalamaia order portal — GitHub Pages + Google Sheets

This package updates the website so customers can register, receive a customer ID, submit orders, and track orders. The website frontend belongs in the GitHub repository root. The Apps Script file is installed separately in Google Apps Script.

## Files

- `index.html` — website layout and Kalamaia branding
- `styles.css` — styling
- `app.js` — registration, order submission, and order tracking
- `.nojekyll` — GitHub Pages helper
- `apps-script/Code.gs` — backend for Google Sheets

## 1. Upload the website files to GitHub

Open the repository that publishes `https://kalamaiabusiness.github.io/kalamaiawebsite/`. Upload/replace these four files at the repository root: `index.html`, `styles.css`, `app.js`, and `.nojekyll`. Commit the changes. Do **not** upload `apps-script/Code.gs` as a website file; it must be installed in Apps Script.

## 2. Update Google Apps Script

1. Open the Apps Script project connected to your current web-app URL.
2. Open `Code.gs`, replace its contents with `apps-script/Code.gs` from this package, and save.
3. The script uses the existing spreadsheet ID from the previous setup. It adds two tabs named `Customers` and `Orders` and does not delete or overwrite the existing `DB SEP26` tab.
4. Click **Deploy → Manage deployments**, click the pencil icon for the web app, select **New version**, and click **Deploy**. Keep the existing deployment if possible so the `/exec` URL stays the same. If you create a new deployment, update `CONFIG.apiUrl` near the top of `app.js` to the new `/exec` URL and upload `app.js` again.
5. The web app must execute as the spreadsheet owner and be accessible to the website's visitors (typically **Anyone**). Only do this if you are comfortable allowing public customers to submit registration and order forms. Do not store payment card details or passwords in this sheet.

If the spreadsheet ID differs from the existing setup, change `CONFIG.SPREADSHEET_ID` in `Code.gs` to the correct ID before deployment. The script property `SPREADSHEET_ID`, if present, takes precedence over the fallback value.

## 3. How it works

- **Customer ID:** customer enters name, WhatsApp, street address, Kecamatan, city/regency, province, and Kode Pos. The ID is the first name plus the last four digits of the WhatsApp number (for example `Agung6789`). If that ID already exists, a suffix is added to keep it unique.
- **Orders:** customer submits order details, quantity, optional estimated budget, and optional notes. Each order is appended as a new row in `Orders` with a generated reference such as `KM-20261027-ABC123` and initial status `Order received`.
- **Tracking:** customer enters both their customer ID and order reference. The website reads the matching order's status, order details, and tracking reference. Full address and WhatsApp are not shown in tracking results.
- **Spreadsheet export:** open the Google Sheet and use **File → Download → Microsoft Excel (.xlsx)** or **Comma-separated values (.csv)**.

## 4. Update order statuses

In the `Orders` tab, update the `Status`, `Tracking Reference`, and `Updated At` columns for an order. Suggested statuses are `Order received`, `Preparing`, `Ready to ship`, `Shipped`, `Delivered`, or `On hold`. Enter a tracking number/reference in column I. The tracker reads the latest values from the sheet.

## Important notes

- Keep the `Customers` and `Orders` header rows unchanged after setup; the script expects the columns created automatically.
- Anyone can access a public GitHub Pages site. The customer/order submission endpoint is also public, so monitor the sheet for spam and restrict access to the spreadsheet itself to trusted team members. This starter is not a payment system and does not issue refunds.
- If your Apps Script project is not linked to the spreadsheet used for Kalamaia, verify the spreadsheet ID before accepting real customer information.
