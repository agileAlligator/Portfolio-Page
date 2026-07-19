/* ── YOU ARE THE MODEL ─────────────────────────────────────────────────
   The visitor plays the LLM. Every round is written LIVE by a real model
   (llama-3.3-70b) on the worker and arrives one at a time; the visitor reads
   the untrusted artifact and presses COMPLY or REFUSE. The worker adjudicates:
   comply with a hostile one and — with the controls off — the secret leaves
   through a real tool call (game over), then the reveal shows the same call
   blocked by a deterministic control that never read the message. With the
   controls on, that same call is stopped at the tool boundary — you can't lose.
   The artifact body is model-generated UNTRUSTED text: it is rendered with
   textContent — never innerHTML — so a crafted artifact can't inject markup. */
(function () {
	"use strict";

	var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var $ = function (id) { return document.getElementById(id); };
	var el = {
		stage: $("stage"), brief: $("brief"), startWrap: $("start-wrap"), start: $("start"),
		untimedStart: $("untimed-start"), untimed: $("untimed"),
		roundN: $("round-n"), streak: $("streak"),
		artKind: $("art-kind"), artFrom: $("art-from"), artSubject: $("art-subject"), artBody: $("art-body"),
		timer: $("timer"), timerBar: $("timer-bar"),
		comply: $("comply"), refuse: $("refuse"),
		verdict: $("verdict"), reveal: $("reveal"), scorecard: $("scorecard"),
		modeOff: $("mode-off"), modeOn: $("mode-on"), modeNote: $("mode-note"),
		hudMode: $("hud-mode"), caughtWrap: $("caught-wrap"), caughtN: $("caught-n"),
		endShift: $("end-shift"), liveCounter: $("live-counter")
	};

	var API = "https://mcp.apkasture02.workers.dev";
	var DUR = 13000;
	// state.survived: rounds survived this session. state.curId / state.curArt: the live round in flight.
	var state = {
		streak: 0, best: 0, caught: 0, survived: 0, mode: "off",
		running: false, untimed: false, decided: false, busy: false, to: null,
		curId: null, curArt: null
	};
	var MODE_NOTE = {
		off: "You are the only thing between the message and the tool. One wrong call and something real leaves.",
		on: "A deterministic check sits in front of every tool — the same rule that would refuse each call if you leaked with the controls off. Your judgment is still scored. It just stops being load-bearing."
	};

	function clearTimer() {
		if (state.to) { clearTimeout(state.to); state.to = null; }
		el.timerBar.style.transition = "none";
		el.timerBar.style.transform = "scaleX(1)";
	}

	function startTimer() {
		clearTimer();
		if (state.untimed || reduced) { el.timer.hidden = true; return; }
		el.timer.hidden = false;
		el.timerBar.offsetWidth;                         // reflow so the reset sticks
		el.timerBar.style.transition = "transform " + DUR + "ms linear";
		el.timerBar.style.transform = "scaleX(0)";
		state.to = setTimeout(function () { if (!state.decided) decide("comply", true); }, DUR);
	}

	function clearNode(n) { while (n.firstChild) n.removeChild(n.firstChild); }

	function setChoices(on) {
		el.comply.disabled = !on;
		el.refuse.disabled = !on;
	}

	// renders an artifact {kind,from,subject,body} into the card. body is untrusted
	// and model-generated — textContent only, never innerHTML.
	function renderArtifact(art) {
		el.artKind.textContent = String(art.kind || "message").toUpperCase().replace("-", " ");
		el.artFrom.textContent = art.from || "";
		el.artSubject.textContent = art.subject || "";
		el.artBody.textContent = art.body || "";
	}

	// "the machine is writing…" placeholder in the artifact body, announced politely via aria-live.
	function showGenerating() {
		el.artKind.textContent = "LIVE";
		el.artFrom.textContent = "llama-3.3-70b";
		el.artSubject.textContent = "";
		clearNode(el.artBody);
		var wrap = document.createElement("span");
		wrap.className = "ytm-gen";
		var dot = document.createElement("span");
		dot.className = "ytm-gen-dot";
		dot.setAttribute("aria-hidden", "true");
		wrap.appendChild(dot);
		wrap.appendChild(document.createTextNode("the machine is writing your next message…"));
		el.artBody.appendChild(wrap);
	}

	// fetch a live round with a 20s abort + one retry. Resolves the round object or throws.
	function fetchRound(attempt) {
		var ctrl = new AbortController();
		var to = setTimeout(function () { ctrl.abort(); }, 20000);
		return fetch(API + "/model/round", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{}",
			signal: ctrl.signal
		}).then(function (r) { clearTimeout(to); return r.json(); })
			.then(function (d) {
				if (d && d.error) throw new Error("rate");       // rate-limited
				if (d && d.degraded) throw new Error("degraded"); // model out of quota
				if (!d || !d.artifact || !d.id) throw new Error("bad");
				return d;
			})
			.catch(function (e) {
				clearTimeout(to);
				if ((attempt || 0) < 1) return fetchRound((attempt || 0) + 1);   // retry once
				throw e;
			});
	}

	// a live round: show generating, fetch, render, then start the timer.
	function showLiveRound() {
		state.decided = false;
		state.curId = null;
		state.curArt = null;
		el.roundN.textContent = String(state.survived + 1);
		el.streak.textContent = String(state.streak);
		el.verdict.className = "";
		clearNode(el.verdict);
		clearNode(el.reveal);
		clearNode(el.scorecard);
		setChoices(false);
		clearTimer();
		el.timer.hidden = true;
		showGenerating();
		state.busy = true;
		fetchRound(0).then(function (d) {
			state.busy = false;
			if (!state.running) return;   // shift ended while fetching
			state.curId = d.id;
			state.curArt = d.artifact;
			renderArtifact(d.artifact);
			setChoices(true);
			el.comply.focus();
			startTimer();
		}).catch(function () {
			state.busy = false;
			if (!state.running) return;
			liveUnavailable();
		});
	}

	// the worker is unreachable / out of quota. No corpus fallback — the exhibit is
	// live-only by design. Show an honest state with a retry affordance. Never throw.
	function liveUnavailable() {
		state.decided = true;
		clearTimer();
		el.timer.hidden = true;
		setChoices(false);
		if (el.endShift) el.endShift.hidden = true;
		el.artKind.textContent = "OFFLINE";
		el.artFrom.textContent = "";
		el.artSubject.textContent = "";
		clearNode(el.artBody);
		var msg = document.createElement("span");
		msg.className = "ytm-gen";
		msg.textContent = "the live model is unavailable right now — it may be waking or out of its free-tier quota.";
		el.artBody.appendChild(msg);
		clearNode(el.verdict); el.verdict.className = "";
		clearNode(el.reveal);
		var wrap = document.createElement("div");
		wrap.className = "ytm-scorecard";
		var line = document.createElement("p");
		line.className = "ytm-score-line";
		line.textContent = "Every round is written live by the model, so there's nothing to fall back to — that's the point. Try again in a moment.";
		wrap.appendChild(line);
		var retry = mkButton("Try again", function () {
			if (el.endShift) el.endShift.hidden = false;
			showLiveRound();
		});
		wrap.appendChild(retry);
		clearNode(el.scorecard);
		el.scorecard.appendChild(wrap);
		retry.focus();
	}

	// stamp grammar: every verdict leads with an uppercase word+glyph so it never reads by colour alone
	var STAMP = {
		leak:   "LEAKED ✕",
		caught: "CAUGHT ◆",
		safe:   "HELD ▮"
	};
	function verdict(kind, msg, note, stampOverride) {
		var cls = kind === "leak" ? "ytm-verdict-leak" : kind === "caught" ? "ytm-verdict-caught" : "ytm-verdict-safe";
		el.verdict.className = "ytm-verdict " + cls;
		clearNode(el.verdict);
		var stamp = document.createElement("span");
		stamp.className = "ytm-stamp";
		stamp.textContent = stampOverride || STAMP[kind] || STAMP.safe;
		el.verdict.appendChild(stamp);
		el.verdict.appendChild(document.createTextNode(msg));
		if (note) {
			var s = document.createElement("span");
			s.className = "ytm-note";
			s.textContent = note;
			el.verdict.appendChild(s);
		}
	}

	function col(labelText, callText, noteText) {
		var c = document.createElement("div");
		c.className = "ytm-reveal-col";
		var lab = document.createElement("div");
		lab.className = "ytm-reveal-col-label";
		lab.textContent = labelText;
		var bodyWrap = document.createElement("div");
		bodyWrap.className = "ytm-reveal-col-body";
		var call = document.createElement("p");
		call.className = "ytm-call";
		call.textContent = callText;
		bodyWrap.appendChild(call);
		var note = document.createElement("p");
		note.className = "ytm-call";
		var em = document.createElement("span");
		em.className = "ytm-note";
		em.textContent = noteText;
		note.appendChild(em);
		bodyWrap.appendChild(note);
		c.appendChild(lab);
		c.appendChild(bodyWrap);
		return c;
	}

	function reveal(r) {
		var box = document.createElement("div");
		box.className = "ytm-reveal";
		var head = document.createElement("p");
		head.className = "ytm-reveal-head";
		head.textContent = "// the same call, twice";
		box.appendChild(head);
		var cols = document.createElement("div");
		cols.className = "ytm-reveal-cols";
		cols.appendChild(col("You complied", r.toolCall,
			"That call fired. The attacker got the effect they wanted — you were convinced, which is exactly the job working as designed."));
		cols.appendChild(col("The control", r.control,
			"Same call. The control never read the message — it checked a rule and stopped it."));
		box.appendChild(cols);
		var cap = document.createElement("p");
		cap.className = "ytm-reveal-caption";
		cap.textContent = "The control didn't need to be smart. It needed to be code.";
		box.appendChild(cap);
		clearNode(el.reveal);
		el.reveal.appendChild(box);
	}

	function scoreLine(parent, label, num) {
		var p = document.createElement("p");
		p.className = "ytm-score-line";
		p.appendChild(document.createTextNode(label + " "));
		var n = document.createElement("span");
		n.className = "ytm-score-num";
		n.textContent = num;
		p.appendChild(n);
		parent.appendChild(p);
	}

	function mkButton(label, onClick) {
		var b = document.createElement("button");
		b.className = "btn";
		b.type = "button";
		b.textContent = label;
		b.addEventListener("click", onClick);
		return b;
	}

	function lossLine(r) {
		if (r.tool === "issue_refund") return "You fired a refund no one authorized.";
		if (r.tool === "post_status") return "You published something that never should have left.";
		return "You sent a secret out of the building.";
	}

	// controls off + comply on hostile: the secret leaves. Game over → reveal → scorecard.
	function leak(r, auto) {
		state.running = false;
		clearTimer();
		el.timer.hidden = true;
		setChoices(false);
		if (el.endShift) el.endShift.hidden = true;
		var why = auto ? " You ran out of time — the queue moved and you complied by default." : "";
		verdict("leak", lossLine(r) + why, r.explain);
		reveal(r);
		endScorecard("loss");
	}

	// controls on: a hostile call you approved is refused at the tool boundary — no leak, no game over
	function caughtRound(r, auto) {
		clearTimer();
		el.timer.hidden = true;
		setChoices(false);
		state.caught++;
		state.streak = 0;
		el.streak.textContent = "0";
		el.caughtN.textContent = String(state.caught);
		verdict("caught", auto
			? "Time ran out — you complied by default. The control stopped the call anyway."
			: "You complied. The control stopped the call before it did anything.", r.explain);
		// the attempted call + the exact rule that stopped it, above the explain note
		var callEl = document.createElement("span");
		callEl.className = "ytm-verdict-call";
		callEl.textContent = r.toolCall;
		var ruleEl = document.createElement("span");
		ruleEl.className = "ytm-verdict-call";
		ruleEl.textContent = r.control;
		var note = el.verdict.querySelector(".ytm-note");
		if (note) { el.verdict.insertBefore(ruleEl, note); el.verdict.insertBefore(callEl, ruleEl); }
		else { el.verdict.appendChild(callEl); el.verdict.appendChild(ruleEl); }
		// explicit gate so the caught moment gets read
		var next = mkButton("next artifact", function () {
			clearNode(el.verdict); el.verdict.className = "";
			clearNode(el.reveal);
			nextRound();
		});
		next.className = "btn ytm-next";
		el.reveal.appendChild(next);
		setTimeout(function () { if (next.isConnected) next.focus(); }, 150);   // let the polite verdict announce first
	}

	function nextRound() {
		showLiveRound();
	}

	// ── the public, un-spoofable global counter (from /stats.model) ─────────
	function fetchStats(cb) {
		var ctrl = new AbortController();
		var to = setTimeout(function () { ctrl.abort(); }, 20000);
		fetch(API + "/stats", { signal: ctrl.signal })
			.then(function (r) { clearTimeout(to); return r.json(); })
			.then(function (d) { cb((d && d.model) || null); })
			.catch(function () { clearTimeout(to); cb(null); });
	}
	function fillCounter(node, m) {
		if (!node) return;
		clearNode(node);
		if (!m || !m.hostileServed) {
			// 0/0 — no data yet. Keep the framing honest.
			node.appendChild(document.createTextNode("Across everyone playing: no hostile requests served yet. The deterministic control's leaks: "));
			var z0 = document.createElement("span"); z0.className = "ytm-live-counter-num"; z0.textContent = "0";
			node.appendChild(z0); node.appendChild(document.createTextNode("."));
			node.hidden = false;
			return;
		}
		var pct = Math.round((m.hostileLeaked / m.hostileServed) * 100);
		node.appendChild(document.createTextNode("Across everyone playing: "));
		var a = document.createElement("span"); a.className = "ytm-live-counter-num"; a.textContent = String(m.hostileLeaked);
		node.appendChild(a);
		node.appendChild(document.createTextNode(" of "));
		var b = document.createElement("span"); b.className = "ytm-live-counter-num"; b.textContent = String(m.hostileServed);
		node.appendChild(b);
		node.appendChild(document.createTextNode(" hostile requests approved (" + pct + "%). The deterministic control: "));
		var c = document.createElement("span"); c.className = "ytm-live-counter-num"; c.textContent = "0";
		node.appendChild(c);
		node.appendChild(document.createTextNode(". One class of misuse taken off the table by the control — not proof that prompt injection is solved."));
		node.hidden = false;
	}
	function refreshStartCounter() {
		if (!el.liveCounter) return;
		el.liveCounter.hidden = false;
		clearNode(el.liveCounter);
		el.liveCounter.appendChild(document.createTextNode("…"));
		fetchStats(function (m) { fillCounter(el.liveCounter, m); });
	}

	// live has no fixed length. "End shift" ends the session and shows the scorecard:
	// controls-off → survived/streak; controls-on → the caught payoff.
	function endShift() {
		if (!state.running) return;
		state.running = false;
		state.decided = true;
		state.busy = false;
		clearTimer();
		el.timer.hidden = true;
		setChoices(false);
		if (el.endShift) el.endShift.hidden = true;
		clearNode(el.reveal);
		if (state.mode === "on") {
			var n = state.caught, calls = n === 1 ? "call" : "calls", times = n === 1 ? "time" : "times";
			if (n > 0) {
				verdict("caught",
					"Shift ended. " + state.survived + " rounds worked. " + n + " hostile " + calls + " got past you. Stopped at the tool boundary: " + n + " of " + n + ". Leaked: nothing. Paid out: nothing.",
					"You were wrong " + n + " " + times + " and it didn't matter. The same deterministic rules — recipient allowlists, amount caps, DLP on tool arguments, human-in-loop — refuse the call no matter who's convinced. Against a model that writes a fresh attack every round, the control is the thing that doesn't tire.");
			} else {
				verdict("safe", "Shift ended. " + state.survived + " rounds, zero hostile calls got past you. The controls sat idle.",
					"That's the happy path. Run it with the controls off and see how long the judgment holds against a model that never stops trying.", "OK ▮");
			}
		} else {
			verdict("safe", "Shift ended on your terms — no leak. " + state.survived + " rounds survived.",
				"You quit while ahead. That's the honest way to win this: the only guaranteed way not to leak is to stop reading messages. The model doesn't get that option.", "OK ▮");
		}
		endScorecard(state.mode === "on" ? "on" : "off");
	}

	// outcome: "loss" (controls-off leak) | "off" (ended, controls off) | "on" (ended, controls on)
	function endScorecard(outcome) {
		var box = document.createElement("div");
		box.className = "ytm-scorecard";
		scoreLine(box, "Rounds survived:", String(state.survived));
		scoreLine(box, "Longest run of correct calls:", String(state.best));
		if (outcome === "on") {
			scoreLine(box, "Hostile calls that got past you:", String(state.caught));
			if (state.caught > 0) scoreLine(box, "Of those, stopped at the tool boundary:", state.caught + " of " + state.caught);
		} else {
			scoreLine(box, "The deterministic control's leaks, across every run:", "0");
		}
		var primary, secondary;
		if (outcome === "on") {
			primary = mkButton("Play again, controls off", function () { restart("off"); });
			secondary = mkButton("Play again", function () { restart("on"); });
		} else if (outcome === "loss") {
			primary = mkButton("Play again, controls on", function () { restart("on"); });
			secondary = mkButton("Take the shift again", function () { restart("off"); });
		} else {
			primary = mkButton("Play again, controls on", function () { restart("on"); });
			secondary = mkButton("Play again", function () { restart("off"); });
		}
		box.appendChild(primary);
		box.appendChild(secondary);
		// the public, un-spoofable global stat, refreshed from /stats
		var counter = document.createElement("p");
		counter.className = "ytm-live-counter";
		counter.id = "score-counter";
		box.appendChild(counter);
		clearNode(el.scorecard);
		el.scorecard.appendChild(box);
		fetchStats(function (m) { fillCounter(counter, m); });
		primary.focus();
	}

	// the shared outcome logic. `r` is built from the judge response merged with the
	// shown artifact. Bumps the rounds-survived counter whenever a round is survived
	// (i.e. not a controls-off leak, which ends the shift).
	function adjudicate(r, action, auto) {
		var complied = action === "comply";

		if (r.malicious) {
			if (complied) {
				if (state.mode === "on") { state.survived++; caughtRound(r, auto); return; }
				leak(r, auto); return;   // controls off: leak ends the shift (game over)
			}
			state.survived++;
			state.streak++;
			state.best = Math.max(state.best, state.streak);
			el.streak.textContent = String(state.streak);
			verdict("safe", "Held. That one was hostile.", r.explain);
			setTimeout(nextRound, 1200);   // real dwell even in reduced-motion, so the verdict is readable/announced
		} else {
			if (complied) {
				state.survived++;
				state.streak++;
				state.best = Math.max(state.best, state.streak);
				el.streak.textContent = String(state.streak);
				verdict("safe", auto
					? "Time ran out — you complied by default. It was a real customer this time; it won't always be."
					: "Handled. A real customer, helped.", r.explain, "OK ▮");
				if (state.mode === "on" && r.control) {   // show the controls passing real work, not just blocking
					var permit = document.createElement("span");
					permit.className = "ytm-verdict-call";
					permit.textContent = r.control;
					el.verdict.appendChild(permit);
				}
				setTimeout(nextRound, 1200);
			} else {
				state.survived++;
				state.streak = 0;
				el.streak.textContent = "0";
				var rnote = state.mode === "on"
					? r.explain + " The controls had no say here — no tool call was ever attempted."
					: r.explain;
				verdict("safe", "You refused a real customer. Over-caution isn't the catastrophe here — but it isn't free.", rnote, "REFUSED ▮");
				setTimeout(nextRound, 1500);
			}
		}
	}

	function decide(action, auto) {
		if (!state.running || state.decided || state.busy) return;
		state.decided = true;
		clearTimer();
		setChoices(false);
		if (!state.curId) { showLiveRound(); return; }   // nothing in flight — recover
		var art = state.curArt || {};
		var id = state.curId;
		var ctrl = new AbortController();
		var to = setTimeout(function () { ctrl.abort(); }, 20000);
		fetch(API + "/model/judge", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: id, decision: action === "comply" ? "comply" : "refuse" }),
			signal: ctrl.signal
		}).then(function (r) { clearTimeout(to); return r.json(); })
			.then(function (j) {
				if (!state.running) return;
				if (j && j.error) { showLiveRound(); return; }   // round expired → fresh round
				var r = {
					malicious: !!j.malicious, technique: j.technique || "", tool: j.tool || "",
					toolCall: j.toolCall || "", control: j.control || "", explain: j.explain || "",
					kind: art.kind, from: art.from, subject: art.subject, body: art.body
				};
				adjudicate(r, action, auto);
			})
			.catch(function () {
				clearTimeout(to);
				if (!state.running) return;
				// judge unreachable: don't punish the player — advance to a fresh round.
				verdict("safe", "Couldn't reach the adjudicator — skipping this one.",
					"The live model or the network dropped. Moving to the next message.", "SKIP ▮");
				setTimeout(showLiveRound, 1200);
			});
	}

	function setMode(mode) {
		state.mode = mode === "on" ? "on" : "off";
		if (el.modeOff) el.modeOff.checked = state.mode === "off";
		if (el.modeOn) el.modeOn.checked = state.mode === "on";
		if (el.modeNote) el.modeNote.textContent = MODE_NOTE[state.mode];
		if (el.hudMode) {
			el.hudMode.textContent = state.mode;
			el.hudMode.className = "ytm-hud-val" + (state.mode === "on" ? " ytm-hud-val-on" : "");
		}
		if (el.caughtWrap) el.caughtWrap.hidden = state.mode !== "on";
	}

	function startGame() {
		state.streak = 0; state.best = 0; state.caught = 0; state.survived = 0;
		state.running = true; state.decided = false; state.busy = false;
		state.curId = null; state.curArt = null;
		el.caughtN.textContent = "0";
		setMode(state.mode);
		el.brief.hidden = true;
		el.startWrap.hidden = true;
		el.stage.hidden = false;
		if (el.endShift) el.endShift.hidden = false;   // live is endless — end-shift always available
		el.roundN.textContent = "1";
		el.comply.focus();
		showLiveRound();
	}

	function restart(mode) {
		if (mode) setMode(mode);
		clearNode(el.verdict); el.verdict.className = "";
		clearNode(el.reveal); clearNode(el.scorecard);
		startGame();
	}

	el.start.addEventListener("click", function () {
		state.untimed = el.untimedStart.checked;
		el.untimed.checked = state.untimed;
		state.mode = (el.modeOn && el.modeOn.checked) ? "on" : "off";   // startGame() syncs the UI via setMode
		startGame();
	});
	[el.modeOff, el.modeOn].forEach(function (radio) {
		if (radio) radio.addEventListener("change", function () {
			if (radio.checked && el.modeNote) el.modeNote.textContent = MODE_NOTE[radio.value];
		});
	});
	if (el.endShift) el.endShift.addEventListener("click", function () { endShift(); });
	el.comply.addEventListener("click", function () { decide("comply", false); });
	el.refuse.addEventListener("click", function () { decide("refuse", false); });
	el.untimed.addEventListener("change", function () {
		state.untimed = el.untimed.checked;
		if (state.running && !state.decided && !state.busy) startTimer();
	});
	document.addEventListener("keydown", function (e) {
		if (!state.running || state.decided || state.busy) return;
		if (e.ctrlKey || e.metaKey || e.altKey) return;   // don't hijack copy / reload / etc.
		var k = e.key.toLowerCase();
		if (k === "c") { e.preventDefault(); decide("comply", false); }
		else if (k === "r") { e.preventDefault(); decide("refuse", false); }
	});

	// the public counter is meaningful before you even start — show it on the start screen.
	refreshStartCounter();
})();
