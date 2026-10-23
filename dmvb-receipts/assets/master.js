/* DMVb Receipts: Order List Master PDF.
   Builds the packing / QC document from the SAME parsed orders the receipts use.
   window.DMVBMaster.build(orders, supplierRows|null, settings, {append}, existingDoc) -> jsPDF */
(function () {
	'use strict';
	var PW = 612, PH = 792;
	var BLK = [0, 0, 0], WHT = [255, 255, 255], GREY = [85, 85, 85], LINE = [187, 187, 187];
	// Items whose EVERY ordered quantity is listed in "Partial Quantities" (others list part-unit quantities only).
	var ALL_QTY_ITEM = /^lacewing eggs$/i, ALL_QTY_SIZE = /card/i;

	function hx(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
	function qf(v) { // quantities under 1 as fraction symbols
		v = Math.round(v * 10000) / 10000;
		if (v > 0 && v < 1) {
			var sym = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
			if (sym[v]) { return sym[v]; }
			for (var den = 2; den <= 8; den++) { var n = Math.round(v * den); if (Math.abs(n / den - v) < 1e-6) { return n + '/' + den; } }
		}
		return String(+v.toFixed(2));
	}
	function lc(s) { return String(s).toLowerCase(); }
	function cmp(a, b) { a = lc(a); b = lc(b); return a < b ? -1 : a > b ? 1 : 0; }

	function build(orders, supplier, S, opts, doc) {
		opts = opts || {};
		var jsPDF = window.jspdf.jsPDF;
		var d = doc || new jsPDF({ unit: 'pt', format: 'letter' });
		var red = hx((S && S.rd) || '#e00000');
		var kw = ((S && S.fk) || '').trim();
		var firstPage = 1;
		if (opts.append) { d.addPage(); firstPage = d.getNumberOfPages(); }
		d.setCharSpace(0);
		var noFooter = {};

		/* ---------- drawing helpers ---------- */
		function style(b, i) { return b ? 'bold' : (i ? 'italic' : 'normal'); }
		function W(t, s, b, i) { d.setFont('helvetica', style(b, i)); d.setFontSize(s); return d.getTextWidth(String(t)); }
		function tx(t, x, y, o) {
			o = o || {}; var s = o.s || 9;
			d.setFont('helvetica', style(o.b, o.i)); d.setFontSize(s); d.setTextColor.apply(d, o.c || BLK);
			var w = d.getTextWidth(String(t)), xx = x;
			if (o.al === 'r') { xx = x - w; } else if (o.al === 'c') { xx = x - w / 2; }
			d.text(String(t), xx, y); return w;
		}
		function star(cx, cy, r) {
			var p = [], i, q;
			for (i = 0; i < 10; i++) { var a = (-90 + i * 36) * Math.PI / 180; q = i % 2 ? r * 0.4 : r; p.push([cx + q * Math.cos(a), cy + q * Math.sin(a)]); }
			d.setFillColor.apply(d, red);
			d.lines(p.slice(1).map(function (v, k) { return [v[0] - p[k][0], v[1] - p[k][1]]; }), p[0][0], p[0][1], [1, 1], 'F', true);
		}
		function box(x, y, z) { d.setDrawColor(0, 0, 0); d.setLineWidth(0.7); d.rect(x, y, z, z); }
		/* a "line" is a string, {t,b,i,c,s}, or an array of segments; segment {star:true} / {box:true} draw shapes */
		function segs(l) { return typeof l === 'string' ? [{ t: l }] : (Array.isArray(l) ? l : [l]); }
		function segW(g, s) {
			var z = g.s || s;
			if (g.star) { return 3 + z * 0.9; }
			if (g.box) { return z * 0.82 + 3; }
			return W(g.t, z, g.b, g.i);
		}
		function lineW(l, s) { return segs(l).reduce(function (a, g) { return a + segW(g, s); }, 0); }
		function drawLine(l, x, y, s, al, w) {
			var sg = segs(l), tot = lineW(l, s), xx = x;
			if (al === 'r') { xx = x + w - tot; } else if (al === 'c') { xx = x + (w - tot) / 2; }
			sg.forEach(function (g) {
				var z = g.s || s;
				if (g.star) { star(xx + 3 + z * 0.45, y - z * 0.34, z * 0.45); }
				else if (g.box) { var bs = z * 0.82; box(xx, y - bs + 0.5, bs); }
				else { tx(g.t, xx, y, { s: z, b: g.b, i: g.i, c: g.c }); }
				xx += segW(g, s);
			});
		}
		/* ---------- generic table ---------- */
		/* cols: [{w,h,al}]; rows: [[cell,...]]; cell = {l:[line,...], s:size, al} (or a plain string) */
		function layoutCell(c, w) {
			if (typeof c === 'string') { c = { l: [c], s: 8.5 }; }
			var s = c.s || 8.5, out = [], avail = w - 6;
			(c.l || []).forEach(function (ln) {
				var sg = segs(ln), z = (sg[0] && sg[0].s) || s;
				if (sg.length === 1 && sg[0].t != null && !sg[0].star && !sg[0].box && lineW(ln, s) > avail) {
					d.setFont('helvetica', style(sg[0].b, sg[0].i)); d.setFontSize(z);
					d.splitTextToSize(String(sg[0].t), avail).forEach(function (t) { out.push({ l: [{ t: t, b: sg[0].b, i: sg[0].i, c: sg[0].c, s: sg[0].s }], s: z, h: z * 1.18 }); });
				} else { out.push({ l: ln, s: z, h: z * 1.18 }); }
			});
			return { lines: out, al: c.al || 'l', h: out.reduce(function (a, x) { return a + x.h; }, 0) };
		}
		function table(cols, rows, x, y, o) {
			o = o || {};
			var hh = o.hh || 14, pad = o.pad == null ? 2.2 : o.pad, lim = o.limit || PH - 46, cx = [], tot = 0, hs = o.hs || 7.5;
			cols.forEach(function (c) { cx.push(x + tot); tot += c.w; });
			function head(yy) {
				d.setFillColor(0, 0, 0); d.rect(x, yy, tot, hh, 'F');
				cols.forEach(function (c, i) {
					if (!c.h) { return; }
					tx(c.h, c.al === 'r' ? cx[i] + c.w - 3 : cx[i] + 3, yy + hh - 4.6, { s: hs, b: 1, c: WHT, al: c.al === 'r' ? 'r' : 'l' });
				});
			}
			var laid = rows.map(function (r) {
				var cells = r.map(function (c, i) { return layoutCell(c, cols[i].w); });
				return { cells: cells, h: Math.max.apply(null, cells.map(function (c) { return c.h; })) + 2 * pad };
			});
			if (o.dry) { return hh + laid.reduce(function (a, r) { return a + r.h; }, 0); }
			head(y); y += hh;
			laid.forEach(function (r) {
				if (o.paginate && y + r.h > lim) { d.addPage(); y = 36; head(y); y += hh; }
				r.cells.forEach(function (c, i) {
					var cy = y + pad;
					c.lines.forEach(function (ln) {
						drawLine(ln.l, cx[i] + 3, cy + ln.s * 0.88, ln.s, c.al, cols[i].w - 6);
						cy += ln.h;
					});
				});
				d.setDrawColor.apply(d, LINE); d.setLineWidth(0.4); d.line(x, y + r.h, x + tot, y + r.h);
				y += r.h;
			});
			return y;
		}
		var CB = function () { return { l: [[{ box: true, s: 11 }]], s: 11 }; };
		function T1(t, b, s, c, al) { return { l: [{ t: String(t), b: b, c: c, s: s }], s: s || 8.5, al: al }; }

		/* ---------- data ---------- */
		var dates = [];
		orders.forEach(function (o) { if (o.date && dates.indexOf(o.date) < 0) { dates.push(o.date); } });
		var dateTxt = dates.length === 1 ? dates[0] : (dates.length > 1 && dates.length <= 3 ? dates.join(' / ') : (dates.length ? 'multiple dates' : ''));
		var nLines = orders.reduce(function (a, o) { return a + o.items.length; }, 0);
		var hasNem = function (o) { return o.items.some(function (i) { return i.st; }); };

		/* =============== PAGE 1: supplier list + partial quantities + nematodes =============== */
		var y = 29, x0 = 36;
		var rows, cols;
		if (supplier && supplier.length) {
			tx('Supplier Order List', x0, y + 14, { s: 16, b: 1 }); y += 27;
			var hasOQ = supplier.some(function (e) { return e.oq || e.ex; });
			cols = hasOQ ? [{ w: 23, h: '' }, { w: 137, h: 'PRODUCT' }, { w: 119, h: 'SIZE' }, { w: 86, h: 'SKU' }, { w: 65, h: 'QTY NEEDED' }, { w: 58, h: 'ORDER QTY' }, { w: 52, h: 'EXTRA' }] : [{ w: 23, h: '' }, { w: 200, h: 'PRODUCT' }, { w: 150, h: 'SIZE' }, { w: 100, h: 'SKU' }, { w: 67, h: 'QTY NEEDED' }];
			rows = supplier.map(function (e) {
				var r0 = [CB(), T1(e.item, 1, 8.5), T1(e.size, 0, 8.5), T1(e.skus.join(', '), 0, 7.5), T1(+e.need.toFixed(2), 1, 8.5)];
				if (hasOQ) { r0.push(T1(+e.oq.toFixed(2), 0, 8.5), T1(e.ex ? +e.ex.toFixed(2) : '', 0, 8.5)); }
				return r0;
			});
			y = table(cols, rows, x0, y, { paginate: true, hs: 7.5 });
		} else {
			tx('Order Totals by Product', x0, y + 14, { s: 16, b: 1 }); y += 27;
			var tm = {};
			orders.forEach(function (o) { o.items.forEach(function (i) { var k = i.item + '\u0001' + i.size; tm[k] = tm[k] || { item: i.item, size: i.size, n: 0 }; tm[k].n += i.v; }); });
			var tl = Object.keys(tm).map(function (k) { return tm[k]; }).sort(function (a, b) { return cmp(a.item, b.item) || cmp(a.size, b.size); });
			cols = [{ w: 23, h: '' }, { w: 200, h: 'PRODUCT' }, { w: 190, h: 'SIZE' }, { w: 127, h: 'QTY NEEDED' }];
			rows = tl.map(function (e) { return [CB(), T1(e.item, 1, 8.5), T1(e.size, 0, 8.5), T1(+e.n.toFixed(2), 1, 8.5)]; });
			y = table(cols, rows, x0, y, { paginate: true, hs: 7.5 });
		}

		// partial quantities
		var part = {}, k0;
		orders.forEach(function (o) {
			o.items.forEach(function (i) {
				var frac = Math.abs(i.v - Math.round(i.v)) > 1e-9, all = ALL_QTY_ITEM.test(i.item) && ALL_QTY_SIZE.test(i.size);
				if (!frac && !all) { return; }
				k0 = i.item + '\u0001' + i.size; part[k0] = part[k0] || { item: i.item, size: i.size, vals: {} };
				var key = String(Math.round(i.v * 10000) / 10000); part[k0].vals[key] = (part[k0].vals[key] || 0) + 1;
			});
		});
		var partList = Object.keys(part).map(function (k) { return part[k]; }).sort(function (a, b) { return cmp(a.item, b.item) || cmp(a.size, b.size); });
		var partRows = partList.map(function (p) {
			var txt = Object.keys(p.vals).map(Number).sort(function (a, b) { return b - a; }).map(function (v) { return p.vals[String(v)] + ' × ' + qf(v); }).join(', ');
			return [{ l: [{ t: p.item, b: 1, s: 8.5 }, { t: p.size, c: GREY, s: 7.5 }], s: 8.5 }, T1(txt, 1, 8.5)];
		});
		var partCols = [{ w: 136.8, h: 'ITEM / SIZE' }, { w: 118.8, h: 'PARTIALS' }];

		// nematodes (or whatever the footnote trigger word is)
		var nem = orders.filter(hasNem).sort(function (a, b) { return cmp(a.loc, b.loc) || cmp(a.name, b.name); });
		var nemRows = nem.map(function (o) {
			var items = o.items.filter(function (i) { return i.st; }).map(function (i) {
				var short = kw ? i.item.replace(new RegExp(kw, 'i'), '').trim() : i.item;
				return [{ t: qf(i.v), b: 1 }, { t: ' × ' }, { t: (short || i.item) + (i.size ? ' - ' + i.size : ''), c: GREY }];
			});
			return [CB(), { l: [{ t: o.name, b: 1, s: 8.5 }, { t: '#' + o.id + ' · ' + o.loc, c: GREY, s: 7.5 }], s: 8.5 }, { l: items, s: 8.5 }];
		});
		var nemCols = [{ w: 18, h: '' }, { w: 140.4, h: 'CUSTOMER / ORDER / PICKUP' }, { w: 115.2, h: 'ORDERED' }];
		var hL = partRows.length ? 20 + table(partCols, partRows, 0, 0, { dry: true }) : 0;
		var hR = nemRows.length ? 20 + table(nemCols, nemRows, 0, 0, { dry: true }) : 0;
		y += 30;
		if (y + Math.max(hL, hR) > PH - 40) { d.addPage(); y = 36; }
		if (partRows.length) {
			tx('Partial Quantities', x0, y + 13, { s: 13, b: 1 });
			table(partCols, partRows, x0, y + 20, {});
		}
		if (nemRows.length) {
			var rx = x0 + 266.4;
			drawLine([{ t: kw || 'Special handling', b: 1, s: 13 }, { star: true, s: 11 }, { t: ' keep refrigerated · ' + nem.length + ' order' + (nem.length === 1 ? '' : 's'), s: 8.5 }], rx, y + 13, 13);
			table(nemCols, nemRows, rx, y + 20, {});
		}

		/* =============== pickups by location =============== */
		var byloc = {};
		orders.forEach(function (o) { (byloc[o.loc] = byloc[o.loc] || []).push({ name: o.name, id: o.id, nem: hasNem(o) }); });
		var locs = Object.keys(byloc).sort(cmp);
		locs.forEach(function (l) { byloc[l].sort(function (a, b) { return cmp(a.name, b.name); }); });
		function personLine(p) {
			var g = [{ t: p.name }, { t: ' #' + p.id, c: GREY }];
			if (p.nem) { g.push({ star: true }); }
			return g;
		}

		if (!orders.length) { return finish(); }   /* supplier list only */
		/* =============== order list (two columns, one page if it fits) =============== */
		d.addPage();
		var M = 21.6, GAP = 14.4, CWID = (PW - 2 * M - GAP) / 2, colTop = 57.6, colBot = PH - 36;
		tx('Order List Master', M, M + 13.5, { s: 15, b: 1 });
		var sub = [{ t: (dateTxt ? 'Pickup: ' + dateTxt + '  ·  ' : '') + orders.length + ' orders  ·  ' + nLines + ' line items  ·  ' }, { box: true }, { t: ' = packed and checked' }];
		if (orders.some(hasNem)) { sub.push({ t: '  ·  ' }); sub.push({ star: true }); sub.push({ t: ' = ' + (kw || 'special handling') + ' (keep refrigerated)' }); }
		drawLine(sub.map(function (g) { return g.t != null ? { t: g.t, c: [68, 68, 68], s: 8 } : { box: g.box, star: g.star, s: 8 }; }), M, M + 18 + 8 * 0.9 + 2, 8);

		var avail = CWID - 14 - 3;
		function blockLayout(o) {
			var lines = [], hs = 8.75;
			var head = function (sz) { return [{ t: '#' + o.id + '  ' + o.name, b: 1, s: sz }, { t: '  ·  ' + o.loc, c: GREY, s: sz }]; };
			while (lineW(head(hs), hs) > avail && hs > 6.5) { hs -= 0.25; }
			o.items.forEach(function (i) {
				var base = [{ t: qf(i.v), b: 1 }, { t: '  ' + i.item }];
				var full = base.concat(i.size ? [{ t: '  —  ' + i.size, c: GREY }] : []);
				if (i.st) { full.push({ star: true }); }
				if (lineW(full, 7.75) <= avail) { lines.push(full); }
				else { lines.push(base.concat(i.st ? [{ star: true }] : [])); if (i.size) { lines.push([{ t: i.size, c: GREY }]); } }
			});
			var noteLines = [];
			if (o.note) { d.setFont('helvetica', 'italic'); d.setFontSize(7); noteLines = d.splitTextToSize('Note: ' + o.note, avail); }
			return { head: head(hs), hs: hs, lines: lines, notes: noteLines, h: 2 + 10.2 + lines.length * 9 + noteLines.length * 8.3 + 2.5 };
		}
		var colX = [M, M + CWID + GAP], ci = 0, by = colTop;
		orders.forEach(function (o) {
			var b = blockLayout(o);
			if (by + b.h > colBot) { if (ci === 0) { ci = 1; by = colTop; } else { d.addPage(); ci = 0; by = 36; } }
			var bx = colX[ci];
			box(bx + 2, by + 2.4, 7.5);
			drawLine(b.head, bx + 14, by + 2 + b.hs * 0.88, b.hs);
			var yy = by + 2 + 10.2;
			b.lines.forEach(function (ln) { drawLine(ln, bx + 14, yy + 7.75 * 0.88, 7.75); yy += 9; });
			b.notes.forEach(function (t) { tx(t, bx + 14, yy + 7 * 0.88, { s: 7, i: 1, c: [68, 68, 68] }); yy += 8.3; });
			d.setDrawColor.apply(d, LINE); d.setLineWidth(0.4); d.line(bx, by + b.h, bx + CWID, by + b.h);
			by += b.h;
		});


		/* =============== full-page cuttable cards =============== */
		var CW = PW / 2, CH = PH / 5;
		for (var pg = 0; pg < locs.length; pg += 10) {
			d.addPage(); noFooter[d.getNumberOfPages()] = 1;
			var chunk = locs.slice(pg, pg + 10), rowsN = Math.ceil(chunk.length / 2);
			d.setDrawColor(0, 0, 0); d.setLineWidth(0.7); d.setLineDashPattern([3, 3], 0);
			d.line(CW, 0, CW, rowsN * CH);
			for (var r = 1; r < rowsN; r++) { d.line(0, r * CH, PW, r * CH); }
			d.setLineDashPattern([], 0);
			chunk.forEach(function (l, k) {
				var ox = (k % 2) * CW, oy = Math.floor(k / 2) * CH, ppl = byloc[l], n = ppl.length, anyNem = ppl.some(function (p) { return p.nem; });
				var padX = 21.6, iw = CW - 2 * padX, z = 14;
				while (W(l, z, 1) > iw - 62 && z > 8) { z -= 0.25; }
				tx(l, ox + padX, oy + 20.2 + 13.2, { s: z, b: 1 });
				drawLine([{ t: String(n), b: 1 }, { t: ' order' + (n === 1 ? '' : 's') }], ox + CW - padX - lineW([{ t: String(n), b: 1 }, { t: ' order' + (n === 1 ? '' : 's') }], 10), oy + 20.2 + 13.2, 10);
				var ruleY = oy + 20.2 + 19.5; d.setDrawColor(0, 0, 0); d.setLineWidth(0.8); d.line(ox + padX, ruleY, ox + CW - padX, ruleY);
				var bottom = oy + CH - 8, sz = 9.5, ncol = 1;
				var fits = function (s, cols_) { var per = Math.ceil(n / cols_); return ruleY + 3 + s * 0.85 + (per - 1) * s * 1.2 + (anyNem ? 13 : 0) <= bottom; };
				while (sz > 6 && !fits(sz, 1)) { sz -= 0.25; }
				if (!fits(sz, 1)) { ncol = 2; sz = 8; while (sz > 6 && !fits(sz, 2)) { sz -= 0.25; } }
				var per = Math.ceil(n / ncol), lead = sz * 1.2;
				ppl.forEach(function (p, i) {
					var c = Math.floor(i / per), rr = i % per;
					drawLine(personLine(p), ox + padX + c * (iw / ncol), ruleY + 3 + sz * 0.85 + rr * lead, sz);
				});
				if (anyNem) {
					drawLine([{ star: true, s: 7.5 }, { t: ' nematodes: keep refrigerated', s: 7.5, c: GREY }], ox + padX, ruleY + 3 + sz * 0.85 + (per - 1) * lead + 11, 7.5);
				}
			});
		}

		return finish();
		function finish() {
		/* =============== footers =============== */
		var total = d.getNumberOfPages(), p;
		for (p = firstPage; p <= total; p++) {
			if (noFooter[p]) { continue; }
			d.setPage(p);
			tx('Order List Master', 21.6, PH - 18, { s: 8, c: [102, 102, 102] });
			tx('Page ' + (p - firstPage + 1), PW - 21.6, PH - 18, { s: 8, c: [102, 102, 102], al: 'r' });
		}
		d.setPage(total);
			return d;
		}
	}

	window.DMVBMaster = { build: build };
})();
