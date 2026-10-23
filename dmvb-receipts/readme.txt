=== DMVb Receipts ===
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.3.4
License: GPLv2 or later

Adds one "DMVb Receipts" tab to the WordPress admin sidebar. Upload an orders CSV, a supplier CSV, or both; the receipts (PDF, 4 per page) and the Order List Master packing / QC document appear side by side so you can check them before printing (print each, or both in one job). Administrators manage the master design (logo, QR links, chapter name, colours, cleanup rules) under DMVb Receipts > Design (Admin).

== Notes ==
* PDFs are created in the browser. Nothing from the CSV is sent to or stored on the server.
* The PDF libraries (jsPDF 2.5.1, PapaParse 5.4.1, qrcode-generator) are bundled in assets/vendor/, so no CDN is needed.
* Who can make receipts: users with the edit_posts capability (change with the dmvb_receipts_capability filter). Only administrators can edit the design.
