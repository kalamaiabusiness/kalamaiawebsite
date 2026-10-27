# Kalamaia website frontend

## Upload to GitHub Pages
1. Replace `index.html`, `styles.css`, `app.js`, and `.nojekyll` in the root of the `kalamaiawebsite` repository.
2. Commit the changes and wait for GitHub Pages to publish.
3. Open the live website and hard refresh with Ctrl+F5.

## Customer ID confirmation update
After registration succeeds, the confirmation stays visible until the customer clicks **Copy customer ID**. The modal cannot be dismissed with Escape or by clicking outside before copying. The **Continue to order** button becomes available after the copy action. If browser clipboard permissions block automatic copying, the page selects the ID for manual copying and offers a continue option.

## Apps Script
The frontend is configured to use the Kalamaia Apps Script Web App URL currently supplied for this site. Do not expose spreadsheet credentials in frontend files.
