/* ══════════════════════════════════════════════════════════════════
   mcp.js — wires /mcp/ to the live L0→L3 Worker.
     GET  /stats                  → per-rung leak counts + recent feed
     POST /mcp/l0  (or /mcp/l3)  → direct JSON-RPC tools/call demo
     POST /console                → Workers-AI free-text agent console
   Every user/server string is set via textContent — never innerHTML.
   ══════════════════════════════════════════════════════════════════ */
(function () {
	"use strict";
	var API = "https://mcp.apkasture02.workers.dev";
	var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var $ = function (id) { return document.getElementById(id); };

	// ── current rung state ─────────────────────────────────────────────────
	var currentRung = "L0"; // L0 | L3

	// ── relative time ──────────────────────────────────────────────────────
	function ago(ms) {
		var s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
		if (s < 60) return s + "s ago";
		if (s < 3600) return Math.floor(s / 60) + "m ago";
		if (s < 86400) return Math.floor(s / 3600) + "h ago";
		return Math.floor(s / 86400) + "d ago";
	}

	// ── span factory ───────────────────────────────────────────────────────
	function span(cls, txt) {
		var s = document.createElement("span");
		s.className = cls;
		s.textContent = txt;
		return s;
	}

	// ── /stats → scoreboard + feed ─────────────────────────────────────────
	function paintStats(d) {
		// Per-rung leak counts
		var leaks = d.leaks || {};
		var l0el = $("mcp-leak-l0");
		var l3el = $("mcp-leak-l3");
		if (l0el && typeof leaks.L0 === "number") l0el.textContent = String(leaks.L0);
		if (l3el && typeof leaks.L3 === "number") l3el.textContent = String(leaks.L3);

		// Feed
		var feed = $("mcp-feed");
		if (!feed) return;
		// the page tells the L0-vs-L3 story; keep the feed to those two rungs
		var recent = (Array.isArray(d.recent) ? d.recent : []).filter(function (e) { return (e.rung || "").toUpperCase() !== "L2"; });
		if (!recent.length) return; // keep static fallback
		feed.textContent = "";
		recent.forEach(function (e) {
			var row = document.createElement("div");
			row.className = "mcp-feed-item";

			// rung badge
			var rung = (e.rung || "").toUpperCase();
			var rungCls = "mcp-feed-rung " + (rung === "L0" ? "mcp-feed-rung-l0" : "mcp-feed-rung-l3");
			row.appendChild(span(rungCls, rung));

			// effect badge
			var effect = e.effect || "held";
			var effectCls = "mcp-feed-effect " + (
				effect === "leaked" ? "mcp-feed-effect-leaked" : "mcp-feed-effect-held"
			);
			row.appendChild(span(effectCls, effect));

			row.appendChild(span("mcp-feed-tool", e.tool || "?"));
			row.appendChild(span("mcp-feed-snippet", e.snippet || ""));
			row.appendChild(span("mcp-feed-time", e.t ? ago(e.t) : ""));
			feed.appendChild(row);
		});
	}

	function refreshStats() {
		fetch(API + "/stats", { cache: "no-store" })
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (d) { if (d) paintStats(d); })
			.catch(function () { /* leave static fallbacks */ });
	}

	// ── copy button ───────────────────────────────────────────────────────
	var copy = $("mcp-copy");
	if (copy) copy.addEventListener("click", function () {
		var cmd = copy.getAttribute("data-copy") || "";
		var done = function () {
			copy.classList.add("mcp-copied");
			copy.textContent = "copied ✓";
			setTimeout(function () {
				copy.classList.remove("mcp-copied");
				copy.textContent = "copy";
			}, 1500);
		};
		if (navigator.clipboard) navigator.clipboard.writeText(cmd).then(done, done); else done();
	});

	// ── rung toggle ────────────────────────────────────────────────────────
	var toggleBtns = document.querySelectorAll(".mcp-toggle-btn");
	var termTitle = $("mcp-term-title");

	function setRung(rung) {
		currentRung = rung;
		toggleBtns.forEach(function (b) {
			if (b.getAttribute("data-rung") === rung) {
				b.classList.add("active");
			} else {
				b.classList.remove("active");
			}
		});
		if (termTitle) termTitle.textContent = "agent @ " + rung + " · workers-ai session";
	}

	toggleBtns.forEach(function (b) {
		b.addEventListener("click", function () { setRung(b.getAttribute("data-rung")); });
	});

	// ── Workers-AI free-text console ─────────────────────────────────────
	var agentLog = $("mcp-agent-log");
	var agentInput = $("mcp-input");
	var agentForm = $("mcp-form");
	var agentRun = $("mcp-agent-run");
	var agentClear = $("mcp-agent-clear");
	var agentStatus = $("mcp-agent-status");

	function agentLine(cls, txt) {
		var p = document.createElement("p");
		p.className = "mcp-line " + cls;
		p.textContent = txt;
		if (agentLog) { agentLog.appendChild(p); agentLog.scrollTop = agentLog.scrollHeight; }
	}

	function renderTranscriptItem(m) {
		// The model's register is texture, not hue: model-generated / untrusted
		// text is .asserted (dashed = claimed-but-unverified). The deterministic
		// control's output (held / tool record / result) stays solid.
		if (m.role === "user") agentLine("mcp-line-user asserted", m.text || "");
		else if (m.role === "assistant") agentLine("mcp-line-agent asserted", m.text || "");
		else if (m.role === "tool") {
			if (m.leaked) {
				agentLine("mcp-line-leak asserted", (m.tool || "tool") + " → " + (m.result || ""));
			} else {
				agentLine(m.blocked ? "mcp-line-hold" : "mcp-line-tool",
					(m.tool || "tool") + (m.blocked ? " → held (server-side control)" : " → ran"));
				if (m.result && !m.leaked) agentLine("mcp-line-result", m.result);
			}
		}
		else if (m.role === "system") agentLine("mcp-line-system", m.text || "");
		else if (m.text) agentLine("mcp-line-result", m.text);
	}

	function runAgent(message) {
		if (!message || !message.trim()) return;
		message = message.trim();
		if (agentRun) agentRun.disabled = true;
		if (agentStatus) agentStatus.textContent = "running…";
		agentLine("mcp-line-user asserted", message);
		fetch(API + "/console", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message: message, rung: currentRung }),
		})
			.then(function (r) { return r.json(); })
			.then(function (d) {
				if (d && d.error) { agentLine("mcp-line-system", d.error); return; }
				var t = (d && d.transcript) || [];
				t.forEach(function (m) { if (m.role !== "user") renderTranscriptItem(m); });
				refreshStats();
			})
			.catch(function () {
				agentLine("mcp-line-system", "The in-browser model is unavailable right now. Connect an MCP client to keep attacking: claude mcp add --transport http avneesh-l0 https://mcp.apkasture02.workers.dev/mcp/l0");
			})
			.then(function () {
				if (agentRun) agentRun.disabled = false;
				if (agentStatus) agentStatus.textContent = "llama-3.3-70b · no judgment on defense · the rung decides";
			});
	}

	if (agentForm) agentForm.addEventListener("submit", function (e) {
		e.preventDefault();
		if (agentInput) runAgent(agentInput.value);
	});
	if (agentClear) agentClear.addEventListener("click", function () {
		if (agentInput) agentInput.value = "";
		if (agentLog) {
			agentLog.textContent = "";
			agentLine("mcp-line-hint", "# pick a preset or write your own instruction below.");
		}
	});

	// preset attacks for the agent console
	var presets = $("mcp-presets");
	if (presets) presets.addEventListener("click", function (e) {
		var b = e.target.closest(".mcp-preset");
		if (b && agentInput) { agentInput.value = b.getAttribute("data-attack") || ""; agentInput.focus(); }
	});

	// ── kick off ────────────────────────────────────────────────────────────
	refreshStats();
	if (!reduce) setInterval(function () { if (!document.hidden) refreshStats(); }, 45000);
})();
