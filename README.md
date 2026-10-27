# KALA MAIA — GitHub Pages files

These are the website files to upload to the **root** of your `KALA-MAIA` GitHub repository. They include the JSONP-based read-only customer lookup frontend intended to avoid the browser `Failed to fetch` issue.

## Upload steps
1. Open your `agungpbarus/KALA-MAIA` repository on GitHub.
2. Choose **Add file → Upload files**.
3. Upload `index.html`, `styles.css`, `app.js`, and `.nojekyll` from this folder. You can also upload this README.
4. Choose **Commit changes**. If GitHub asks whether to replace existing files, confirm that you want to replace them.
5. Wait for GitHub Pages to publish, then open the site and press **Ctrl+F5**.

## Important
The frontend is configured to call the existing Apps Script `/exec` URL. For lookup to work, the Apps Script project must also be updated with the matching `Code.gs` from the separate Apps Script fix, then redeployed as a **new version**. Uploading these website files alone does not update the backend.

The lookup uses Customer ID only and returns limited book details (title, author, format, quantity, and unit price). Anyone who knows a customer ID may be able to access those details, so do not add payment or other sensitive fields without stronger verification.
