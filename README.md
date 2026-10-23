# DMVb Receipts (static site)

Upload the Shopify "orders by customer" CSV and/or the "orders by product" CSV and get receipts (PDF, 4 per page) and the Order List Master side by side before printing. Everything runs in the browser; no server, no PHP. Works on GitHub Pages.

- `index.html`: the app.
- `admin.html`: edit the design (logo, QR links, chapter name, colours, cleanup rules), preview it, and download a new `design.js`.
- `design.js`: the published design. Replace it with the downloaded file and commit to change the design for everyone. (If it only holds the logo, the built-in defaults are used.)
- `assets/`: scripts, styles, logo, bundled libraries (jsPDF 2.5.1, PapaParse 5.4.1, qrcode-generator).

## Publish on GitHub Pages
Push these files to a repo, then Settings > Pages > Deploy from branch (root).
