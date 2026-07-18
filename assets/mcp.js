/* ══════════════════════════════════════════════════════════════════
   mcp.js — wires the /mcp/ page to the live Worker.
     GET  /stats   → the "0 for N" counter + the redacted attempts feed
     POST /console → drive the in-browser attack, render the transcript
   Every server/user string is set via textContent — never innerHTML.
   ══════════════════════════════════════════════════════════════════ */
(function () {
	"use strict";
	var API = "https://mcp.apkasture02.workers.dev";
	var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var $ = function (id) { return document.getElementById(id); };

	// ── relative time ──────────────────────────────────────────────────────
	function ago(ms) {
		var s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
		if (s < 60) return s + "s ago";
		if (s < 3600) return Math.floor(s / 60) + "m ago";
		if (s < 86400) return Math.floor(s / 3600) + "h ago";
		return Math.floor(s / 86400) + "d ago";
	}

	// ── /stats → counter + feed ─────────────────────────────────────────────
	function paintStats(d) {
		var c = $("mcp-count");
		if (c && typeof d.blocked === "number") c.textContent = String(d.blocked);

		var feed = $("mcp-feed");
		if (!feed) return;
		var recent = Array.isArray(d.recent) ? d.recent : [];
		if (!recent.length) return; // keep the static .mcp-feed-empty fallback
		feed.textContent = "";
		recent.forEach(function (e) {
			var row = document.createElement("div");
			row.className = "mcp-feed-item";
			row.appendChild(span("mcp-feed-n", "#" + e.n));
			row.appendChild(span("mcp-feed-tool", e.tool || "?"));
			row.appendChild(span("mcp-feed-country", e.country || "??"));
			row.appendChild(span("mcp-feed-snippet", e.snippet || ""));
			row.appendChild(span("mcp-feed-time", e.t ? ago(e.t) : ""));
			feed.appendChild(row);
		});
	}
	function span(cls, txt) { var s = document.createElement("span"); s.className = cls; s.textContent = txt; return s; }

	function refreshStats() {
		fetch(API + "/stats", { cache: "no-store" })
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (d) { if (d) paintStats(d); })
			.catch(function () { /* leave static fallbacks */ });
	}

	// ── copy button ──────────────────────────────────────────────────────────
	var copy = $("mcp-copy");
	if (copy) copy.addEventListener("click", function () {
		var cmd = copy.getAttribute("data-copy") || "";
		var done = function () { copy.classList.add("mcp-copied"); copy.textContent = "copied ✓"; setTimeout(function () { copy.classList.remove("mcp-copied"); copy.textContent = "copy"; }, 1500); };
		if (navigator.clipboard) navigator.clipboard.writeText(cmd).then(done, done); else done();
	});

	// ── console ───────────────────────────────────────────────────────────────
	var log = $("mcp-log"), input = $("mcp-input"), form = $("mcp-form"),
		run = $("mcp-run"), status = $("mcp-status"), clear = $("mcp-clear");

	function line(cls, txt) {
		var p = document.createElement("p");
		p.className = "mcp-line " + cls;
		p.textContent = txt;
		log.appendChild(p);
		log.scrollTop = log.scrollHeight;
	}
	function renderItem(m) {
		if (m.role === "user") line("mcp-line-user", m.text || "");
		else if (m.role === "assistant") line("mcp-line-agent", m.text || "");
		else if (m.role === "tool") {
			line(m.blocked ? "mcp-line-block" : "mcp-line-tool", (m.tool || "tool") + (m.blocked ? "  ✕ blocked" : "  → ran"));
			if (m.result) line("mcp-line-result", m.result);
		}
		else if (m.role === "system") line("mcp-line-system", m.text || "");
		else if (m.text) line("mcp-line-result", m.text);
	}

	function runAttack(message) {
		if (!message || !message.trim()) return;
		message = message.trim();
		run.disabled = true;
		if (status) status.textContent = "running…";
		line("mcp-line-user", message);
		fetch(API + "/console", {
			method: "POST", headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message: message }),
		})
			.then(function (r) { return r.json(); })
			.then(function (d) {
				if (d && d.error) { line("mcp-line-system", d.error); return; }
				var t = (d && d.transcript) || [];
				// the user line is already echoed; skip a duplicate user item from the server
				t.forEach(function (m) { if (m.role !== "user") renderItem(m); });
				refreshStats(); // a real block may have just ticked the counter
			})
			.catch(function () {
				line("mcp-line-system", "The worker didn't answer. Connect a real MCP client and keep attacking — the wall is the same code either way.");
			})
			.then(function () {
				run.disabled = false;
				if (status) status.textContent = "no model on defense · endpoint allowlist only";
			});
	}

	if (form) form.addEventListener("submit", function (e) { e.preventDefault(); runAttack(input.value); });
	if (clear) clear.addEventListener("click", function () {
		input.value = "";
		log.textContent = "";
		line("mcp-line-hint", "# pick a preset or write your own jailbreak below, then hit run.");
		line("mcp-line-hint", "# the agent will try a tool. the server decides — deterministically.");
	});
	var presets = $("mcp-presets");
	if (presets) presets.addEventListener("click", function (e) {
		var b = e.target.closest(".mcp-preset");
		if (b) { input.value = b.getAttribute("data-attack") || ""; input.focus(); }
	});

	// ── kick off ────────────────────────────────────────────────────────────
	refreshStats();
	if (!reduce) setInterval(function () { if (!document.hidden) refreshStats(); }, 45000);
})();
