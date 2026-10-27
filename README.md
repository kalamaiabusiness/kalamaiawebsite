# Kalamaia website — connected frontend

This package configures the website frontend to call the deployed Kalamaia Apps Script web app.

## Upload to GitHub Pages
1. Extract this ZIP.
2. Open the `kalamaiawebsite` GitHub repository.
3. Upload and replace `index.html`, `styles.css`, `app.js`, and `.nojekyll` at the repository root.
4. Commit the changes.
5. Wait a minute, open the live website, and hard refresh with Ctrl+F5.

The `app.js` file is configured with the Apps Script URL supplied by the owner on 27 October 2026. The Apps Script backend must remain deployed as a Web app and accessible to customers.

## Test in this order
1. Open the live site and register using a test name and WhatsApp number you control.
2. Confirm the customer ID is displayed and a new row appears in the `Kalamaia Customers` spreadsheet.
3. Place a test order and confirm the order reference appears and a row is added to `Kalamaia Tracking Orders`.
4. Enter the customer ID and order reference in Track my order.
5. Change the order status and tracking details in the tracking sheet, then run the tracking lookup again.

Do not use real customer personal data for initial testing.
