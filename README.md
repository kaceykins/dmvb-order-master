# DMVb Receipts

WordPress plugin for DMV Beneficials chapters. Upload the Shopify "orders by customer" CSV and/or the "orders by product" CSV and get, side by side before printing:

- **Receipts**: print-ready PDF, 4 per page (cleaned item names, pickup-location colours, nematode footnote, HELP / SHOP QR boxes, chapter name).
- **Order List Master**: packing / QC PDF (Supplier Order List, Partial Quantities, Nematodes, order checklist, cuttable pickup cards).
- **Print both** or download one combined PDF.

All PDFs are generated in the browser (jsPDF); nothing from the CSVs is sent to the server.

## Install
Zip the `dmvb-receipts` folder (or use the release zip) and upload it under WordPress > Plugins > Add New > Upload. A **DMVb Receipts** tab appears in the admin sidebar.

## Layout
- `dmvb-receipts/dmvb-receipts.php`: menu, settings storage, AJAX save (admin only).
- `dmvb-receipts/assets/receipts.js`: CSV parsing, cleanup rules, receipt PDF, design admin page.
- `dmvb-receipts/assets/master.js`: Order List Master PDF.
- `dmvb-receipts/assets/preview.js`: upload + side-by-side preview page.
- `dmvb-receipts/assets/vendor/`: jsPDF 2.5.1, PapaParse 5.4.1, qrcode-generator (bundled).

## Notes
- Anyone with `edit_posts` can make receipts (filter `dmvb_receipts_capability`). Only administrators edit the design (logo, QR links, chapter name, colours, cleanup rules).
- Supplier CSV: both the older layout (Quantity Calculation / Order Quantity / Extra) and the "Total Qty Ordered" layout are read; a title line above the headers is skipped.
