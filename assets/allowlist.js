/* ══════════════════════════════════════════════════════════════════
   allowlist.js — two path matchers rule on the same request, live.
     naive : fnmatch(path, "/files/*")   →  ^/files/.*$   (DOTALL full match)
     hard  : re.fullmatch(r"^/files/[^/]+$", path)
   The pill in each column is coloured by CORRECTNESS (matcher decision vs
   the intended policy), not by the word — so the naive APPROVE on a traversal
   path is red, and the hardened matcher also goes red when a raw %2f rides in
   undecoded. Every string is set via textContent.
   ══════════════════════════════════════════════════════════════════ */
(function () {
	"use strict";
	var $ = function (id) { return document.getElementById(id); };
	var PREFIX = "/files/";

	// ── matchers (faithful; see tests) ──────────────────────────────────────
	var NAIVE = /^\/files\/[\s\S]*$/;   // fnmatch: * → .* under DOTALL, full match
	var HARD  = /^\/files\/[^/]+$/;      // the fix: one segment, no slash
	function naiveApprove(p) { return NAIVE.test(p); }
	function hardApprove(p)  { return HARD.test(p); }

	// Intended policy: decode, drop query, require exactly one real segment.
	function intendedAllow(raw) {
		var p = raw.split("?")[0];
		try { p = decodeURIComponent(p); } catch (e) { /* malformed: keep raw */ }
		if (!/^\/files\/[^/]+$/.test(p)) return false;
		var seg = p.slice(PREFIX.length);
		return seg !== "." && seg !== "..";
	}

	function decodedTail(raw) {
		var p = raw.split("?")[0];
		try { p = decodeURIComponent(p); } catch (e) { p = raw.split("?")[0]; }
		return p;
	}

	// ── reason strings ──────────────────────────────────────────────────────
	function naiveReason(raw) {
		if (raw.indexOf(PREFIX) !== 0) return "no match — no /files/ prefix";
		var tail = raw.slice(PREFIX.length);
		if (tail === "") return '* matched "" — even nothing counts';
		var segs = tail.split("/");
		if (segs.length > 1) return '* matched "' + tail + '" — ' + segs.length + " segments, slash and all";
		return '* matched "' + tail + '"';
	}
	function hardReason(raw) {
		if (raw.indexOf(PREFIX) !== 0) return "no match — no /files/ prefix";
		var tail = raw.slice(PREFIX.length);
		if (hardApprove(raw)) return '[^/]+ matched one segment: "' + tail + '"';
		if (tail === "") return '[^/]+ needs one segment — "" is empty';
		var segs = tail.split("/");
		return '[^/]+ stops at the first / — "' + tail + '" is ' + segs.length + " segments";
	}

	// ── conditional honesty caveat ──────────────────────────────────────────
	function caveatFor(raw) {
		if (!(hardApprove(raw) && !intendedAllow(raw))) return null;
		var rawPath = raw.split("?")[0];
		var dec = decodedTail(raw);
		if (dec !== rawPath && dec.indexOf(PREFIX) === 0 && dec.slice(PREFIX.length).indexOf("/") !== -1) return "encoded";
		var tail = raw.slice(PREFIX.length);
		if (tail === "." || tail === "..") return "dot";
		return "encoded";
	}
	var CAVEATS = {
		encoded: "One turn more: the regex matches the raw string, and %2f is a slash it never decoded. Decode the path, then match — an encoded slash that rides in undecoded still reads as one segment.",
		dot: "One turn more: [^/]+ accepts .. as a segment, and /files/.. climbs to the root. A complete matcher rejects . and .. segments, or resolves the path first."
	};

	// ── render a verdict column ─────────────────────────────────────────────
	function paintPill(pill, approve, intended) {
		pill.textContent = approve ? "APPROVE" : "REJECT";
		pill.classList.remove("al-verdict-safe", "al-verdict-danger");
		pill.classList.add(approve === intended ? "al-verdict-safe" : "al-verdict-danger");
	}

	// ── path visualizer: monospace grid, rails aligned in ch units ──────────
	function span(cls, txt) { var s = document.createElement("span"); s.className = cls; if (txt != null) s.textContent = txt; return s; }

	function paintViz(raw) {
		var viz = $("al-pathviz");
		if (!viz) return;
		viz.textContent = "";

		if (raw.indexOf(PREFIX) !== 0) {
			viz.appendChild(span("al-seg", raw || "(empty)"));
			var note = document.createElement("div");
			note.appendChild(span("al-rail-label", "no /files/ prefix — neither matcher matches"));
			viz.appendChild(note);
			return;
		}

		var tail = raw.slice(PREFIX.length);
		// line 1: the path, prefix dim + segments/slashes
		viz.appendChild(span("al-seg al-seg-prefix", PREFIX));
		var segs = tail.split("/");
		segs.forEach(function (s, i) {
			if (i > 0) viz.appendChild(span("al-slash", "/"));
			viz.appendChild(span("al-seg", s));
		});

		// rails on their own lines: glob spans the whole tail, anchor the first segment
		var railWrap = document.createElement("div");
		railWrap.className = "al-viz-rails";
		railWrap.appendChild(rail("al-rail-glob", "al-label-glob", PREFIX.length, tail.length, "* accepts this"));
		// the anchor matches a single segment: it accepts a lone segment, but a
		// second segment (the traversal) makes the full match fail — that's a reject.
		var anchorText = hardApprove(raw) ? "[^/]+ accepts this" : "[^/]+ stops at the / — rejects";
		railWrap.appendChild(rail("al-rail-anchor", "al-label-anchor", PREFIX.length, segs[0].length, anchorText));
		viz.appendChild(railWrap);
	}

	function rail(barCls, labelCls, offsetCh, widthCh, text) {
		var row = document.createElement("div");
		row.className = "al-rail";
		var bar = span("al-rail-bar " + barCls, null);
		bar.style.marginLeft = offsetCh + "ch";
		bar.style.width = Math.max(widthCh, 0.5) + "ch";
		row.appendChild(bar);
		row.appendChild(span("al-rail-label " + labelCls, text));
		return row;
	}

	// ── evaluate everything for a path ──────────────────────────────────────
	function evaluate(raw) {
		var n = naiveApprove(raw), h = hardApprove(raw), i = intendedAllow(raw);
		paintPill($("al-pill-naive"), n, i);
		paintPill($("al-pill-hard"), h, i);
		$("al-reason-naive").textContent = naiveReason(raw);
		$("al-reason-hard").textContent = hardReason(raw);
		paintViz(raw);

		var cav = $("al-caveat");
		var key = caveatFor(raw);
		if (key) { cav.textContent = CAVEATS[key]; cav.hidden = false; }
		else { cav.textContent = ""; cav.hidden = true; }
	}

	// ── wiring ──────────────────────────────────────────────────────────────
	var input = $("al-input");
	if (input) {
		input.addEventListener("input", function () { evaluate(input.value); });
		evaluate(input.value);
	}
	var presets = $("al-presets");
	if (presets) presets.addEventListener("click", function (e) {
		var b = e.target.closest(".al-preset");
		if (!b || !input) return;
		input.value = b.getAttribute("data-path") || "";
		evaluate(input.value);
		input.focus();
	});
})();
