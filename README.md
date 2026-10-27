# Kalamaia order-format update

This update changes the website order form to match the the `Sheet1` tab in the Kalamaia Orders spreadsheet in the Kalamaia Orders spreadsheet, then writes a summary record to Kalamaia Tracking Orders.

## What happens on order submission

1. The customer ID is taken from the registered customer saved in the browser and validated against `Kalamaia Customers`.
2. The customer can add one or more book lines. Each line has the columns:
   `Cust ID`, `ISBN`, `Title`, `Author`, `Format`, `Source`, `Qty`, `Unit Price`.
3. Each book is appended to the `Sheet1` tab in columns A:H, matching the screenshot. The header is in row 1 and new records begin below it. Order reference and status are stored in the separate Tracking Orders sheet.
4. One summary row per order is appended to `Kalamaia Tracking Orders`, including order reference, customer ID, date, item summary, total quantity, total estimate when prices are provided, and initial status.
5. Tracking looks up the order by both customer ID and order reference.

## Important notes

- `Sheet1` headers must be in row 1 and exactly match the eight expected columns A:H. Data begins in row 2.
- `Kalamaia Tracking Orders` headers are in row 1 and include the `Notes` column in L.
- `Unit Price` is optional. The form does not ask customers for DP, OCT, or Note; those are not among the eight columns shown in the customer-facing sheet.
- Existing records in `Sheet1` are preserved. New web order rows are appended at the bottom.
- Apps Script and frontend must both be updated. A frontend-only update will not route orders into Kalamaia Orders.

## Publish the backend

1. Open the existing Apps Script project `Kalamaia Backend`.
2. Replace all content in `Code.gs` with the included `Code.gs`, then Save.
3. Select `testKalamaiaConnections` and Run. Confirm the execution log says connections succeeded and headers were verified.
4. Click **Deploy → Manage deployments**.
5. Edit the existing Web app deployment (pencil icon), choose **New version**, and Deploy. Use the same deployment so the `/exec` URL stays the same.
6. If you create a completely new deployment instead, update `CONFIG.apiUrl` in `app.js` to that new `/exec` URL.

## Publish the website

1. Extract this ZIP.
2. In the GitHub repository root, replace `index.html`, `styles.css`, `app.js`, and `.nojekyll`.
3. Commit changes and wait for GitHub Pages to publish.
4. Open the live site and hard-refresh with Ctrl+F5.

## Test in this order

1. Submit one test order with one book and a recognizable title.
2. Verify a row is appended to `Sheet1` with the customer ID and all book columns filled as entered. Confirm the generated order reference appears in the Tracking Orders sheet.
3. Verify one summary row is appended to `Kalamaia Tracking Orders` with the same order reference.
4. Add or change the order status, courier, tracking number, and Last Updated in the tracking sheet.
5. Use the website's Track an order form with both the customer ID and order reference. Confirm the latest status appears.

Do not submit real payment data while testing.
