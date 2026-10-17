(function () {
    "use strict";

    var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    var EXCUSES = {
        Monday: [
            "I'm at a one-day workshop on sustainable living. Can't be moved.",
            "My neighbor's installing a new security system and I promised to hold the ladder.",
            "The apartment's finally getting a deep clean. It hasn't been sponge-worthy since March.",
            "Big Monday, actually. I'm declaring it day one of the Summer of George.",
            "Dentist. They had an opening, and I'm not one to spit in the face of an opening.",
            "I have to return a very complicated pair of pants. There's a whole thing.",
            "Monday's spoken for. I'm regifting a label maker and the timing is delicate."
        ],
        Tuesday: [
            "Tuesday's no good. We've got choir practice.",
            "Parent-teacher conference. The kid's struggling in math and, frankly, so am I.",
            "Neighborhood council meeting about the new parking rules. It's a powder keg.",
            "Book club. I picked the book, so I sort of have to show up, don't I?",
            "Night class on personal finance. I'm learning what my habits cost annually.",
            "I'm giving serenity a real shot that day. Serenity now."
        ],
        Wednesday: [
            "Mentoring kids for the science fair. They're counting on my expertise, which is limited.",
            "Author signing. Rare chance to meet the man who wrote the book I bought and never read.",
            "Local food drive. We're aiming to feed 200 families and I over-committed, as usual.",
            "Leading a community yoga session. I started it, so quitting is a whole conversation.",
            "Meeting a career counselor. I'm exploring a pivot into import/export.",
            "It's Wednesday. I'm choosing not to run."
        ],
        Thursday: [
            "Thursday's out. We've got to get to the hospital to see if we qualify as organ donors.",
            "Helping at the community theater. We're staging the puffy-shirt monologue.",
            "Neighborhood clean-up. Someone has to keep the block presentable.",
            "Financial advisor. We're confirming I'm still master of my domain, portfolio-wise.",
            "Networking mixer. I'm prepared to spare exactly one square of small talk.",
            "These pretzels are making me thirsty, and I've set the day aside to deal with it."
        ],
        Friday: [
            "Hosting game night for colleagues. It's a team-building exercise I can't escape.",
            "Cooking class. I've always wanted to make sushi, and this is finally the year.",
            "Stargazing trip. There's a meteor shower that won't come back for years.",
            "Car's in the shop. It's been making a sound I can only describe as ominous.",
            "Gallery opening. A friend's showing work and I said 'of course,' which was my mistake.",
            "Yada yada yada, I can't make it Friday."
        ],
        Saturday: [
            "Saturday's the airing of grievances. It tends to run long.",
            "I have a standing appointment with a very specific bench in the park.",
            "Brunch. There's a line, and I refuse to be the man who doesn't wait in the line.",
            "Estate sale across town. There's a lamp I've been thinking about for weeks.",
            "Laundry. And no, you can't help — it's a two-load situation with feelings.",
            "Helping a friend move. I said yes before I heard the word 'piano.'"
        ],
        Sunday: [
            "Sunday's for the feats of strength. I've been stretching all week.",
            "Long tradition: I do absolutely nothing, and I do it thoroughly.",
            "Brunch, part two. Different friends, same line, equally non-negotiable.",
            "I have to catch up on my shows. All of them. It's a real commitment.",
            "Family dinner. Not that there's anything wrong with it — it just takes all day.",
            "Strict policy of remaining master of my domain until Monday."
        ]
    };

    var SOUP = "No soup for you! Come back one year.";

    var $ = function (id) { return document.getElementById(id); };
    var els = {
        card: $("card"), day: $("day"), excuse: $("excuse"), tabs: $("tabs"),
        spin: $("spin"), another: $("another"), copy: $("copy"), sound: $("sound"),
        fan: $("fan"), knobL: $("knobL"), knobR: $("knobR")
    };
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var FLIP_MS = 480;
    var state = { day: null, locked: false, count: 0, last: "" };

    // build the wheel: card-edge slivers fanning around the axle
    for (var fi = 0; fi < 11; fi++) {
        var sv = document.createElement("span");
        sv.style.setProperty("--i", fi);
        els.fan.appendChild(sv);
    }

    // ── build the day tabs ─────────────────────────────────────────────
    DAYS.forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tab";
        b.textContent = d.slice(0, 3);
        b.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-label", d);
        b.dataset.day = d;
        b.addEventListener("click", function () { newExcuse(d); });
        els.tabs.appendChild(b);
    });
    function highlightTab(day) {
        Array.prototype.forEach.call(els.tabs.children, function (b) {
            b.setAttribute("aria-pressed", b.dataset.day === day ? "true" : "false");
        });
    }

    // ── pick an excuse (no immediate repeat; rare Soup Nazi) ────────────
    function pick(day) {
        if (Math.random() < 0.04) return { text: SOUP, soup: true };
        var list = EXCUSES[day];
        var t;
        do { t = list[Math.floor(Math.random() * list.length)]; }
        while (list.length > 1 && t === state.last);
        state.last = t;
        return { text: t, soup: false };
    }

    // ── render a card face ──────────────────────────────────────────────
    function setCard(day, item) {
        els.day.textContent = day.toUpperCase();
        els.excuse.classList.toggle("soup", !!item.soup);
        // wrap the sentence in subtle quotes for that index-card feel
        els.excuse.textContent = "";
        var open = document.createElement("span"); open.className = "quote"; open.textContent = "“";
        var close = document.createElement("span"); close.className = "quote"; close.textContent = "”";
        els.excuse.appendChild(open);
        els.excuse.appendChild(document.createTextNode(item.text));
        els.excuse.appendChild(close);
    }

    function flip(day, item) {
        if (reduced) { setCard(day, item); return; }
        els.card.classList.remove("flip");
        void els.card.offsetWidth;                 // restart the animation
        els.card.classList.add("flip");
        setTimeout(function () { setCard(day, item); }, FLIP_MS / 2);  // swap while edge-on
    }

    function newExcuse(day, quiet) {
        if (state.locked) return;
        state.day = day;
        highlightTab(day);
        var item = pick(day);
        state.count++;
        if (!reduced) {
            state.locked = true;
            setTimeout(function () { state.locked = false; }, FLIP_MS);
        }
        flip(day, item);
        if (!quiet) slap(item.soup);      // the "another excuse" button plays the full riff instead
    }

    // ── spin: a slot-machine whir that lands on a random day ────────────
    function spin() {
        if (state.locked) return;
        var landDay = DAYS[Math.floor(Math.random() * 7)];
        if (reduced) { newExcuse(landDay); return; }
        state.locked = true;
        lick();
        var n = 0, total = 13;
        (function step() {
            var d = DAYS[Math.floor(Math.random() * 7)];
            highlightTab(d);
            setCard(d, pick(d));      // instant swaps = the whir
            n++;
            if (n < total) { setTimeout(step, 45 + n * n * 1.2); }   // ease-out
            else { state.day = landDay; highlightTab(landDay); setCard(landDay, pick(landDay)); state.count++; state.locked = false; }
        })();
    }

    // ── the bass. a synthesized slap-bass PARODY — no assets, off by default.
    //    deliberately NOT the theme: the real riff sits in E7 and opens with a
    //    DESCENDING G-pentatonic lick, then an ascending chromatic E slap walk.
    //    so we go the other way — A minor-pentatonic, an OCTAVE-JUMP hook (not a
    //    scalar run), and a bluesy climb (the b5 the theme never touches). same
    //    genre (thumb-slap + mouth-pop octaves, ghost notes, funk syncopation),
    //    our own key, our own contour, our own notes. all synthesis.
    var actx = null, soundOn = false, noiseBuf = null;
    function ctx() {
        if (!actx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) { actx = new AC(); noiseBuf = makeNoise(actx); }
        }
        if (actx && actx.state === "suspended") actx.resume();
        return actx;
    }
    function makeNoise(c) {
        var n = Math.floor(c.sampleRate * 0.12);
        var buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }
    // one slap-bass note — a synth patch in the spirit of the M1 "slap bass"
    // the show actually used: saw bite + a sine sub for body + a click transient.
    // opts: {gain, dur, pop, ghost}
    function bass(freq, at, opts) {
        var c = actx; if (!c) return;
        opts = opts || {};
        var pop = !!opts.pop, ghost = !!opts.ghost;
        var gain = opts.gain == null ? (ghost ? 0.09 : 0.30) : opts.gain;
        var dur = opts.dur || (ghost ? 0.06 : (pop ? 0.15 : 0.18));
        // harmonic bite: sawtooth through a lowpass, with a fast slap pitch+filter drop
        var o = c.createOscillator(), bg = c.createGain(), f = c.createBiquadFilter();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(freq * (pop ? 1.6 : 2.2), at);
        o.frequency.exponentialRampToValueAtTime(freq, at + (ghost ? 0.02 : 0.045));
        f.type = "lowpass"; f.Q.value = 7;
        f.frequency.setValueAtTime(pop ? 5200 : 2600, at);
        f.frequency.exponentialRampToValueAtTime(pop ? 720 : 260, at + dur * 0.85);
        bg.gain.setValueAtTime(0.0001, at);
        bg.gain.exponentialRampToValueAtTime(gain, at + 0.004);       // snappy attack
        bg.gain.exponentialRampToValueAtTime(gain * 0.32, at + dur * 0.4);
        bg.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(f); f.connect(bg); bg.connect(c.destination);
        o.start(at); o.stop(at + dur + 0.03);
        // sine sub at the fundamental for weight (the sampled-bass body)
        var sub = c.createOscillator(), sg = c.createGain();
        sub.type = "sine"; sub.frequency.setValueAtTime(freq, at);
        sg.gain.setValueAtTime(0.0001, at);
        sg.gain.exponentialRampToValueAtTime(gain * (ghost ? 0.45 : 0.8), at + 0.006);
        sg.gain.exponentialRampToValueAtTime(0.0001, at + dur * 1.05);
        sub.connect(sg); sg.connect(c.destination);
        sub.start(at); sub.stop(at + dur + 0.05);
        // percussive slap/pop transient (thumb click / string pop) — skipped on ghosts
        if (noiseBuf && !ghost) {
            var ns = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain();
            ns.buffer = noiseBuf;
            nf.type = "bandpass"; nf.frequency.value = pop ? 3800 : 2000; nf.Q.value = 0.8;
            ng.gain.setValueAtTime(0.0001, at);
            ng.gain.exponentialRampToValueAtTime(pop ? 0.16 : 0.20, at + 0.001);
            ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
            ns.connect(nf); nf.connect(ng); ng.connect(c.destination);
            ns.start(at); ns.stop(at + 0.06);
        }
    }
    function play(seq, t0) {                             // seq: [freq, 16th-offset, opts]
        var s = 0.133;                                   // 16ths at ~113bpm — the show's pocket
        seq.forEach(function (n) {
            var off = n[1];
            // swung 16ths: push the off-16ths a hair late for the funk bounce
            var swing = (Math.round(off) % 2 === 1) ? 0.018 : 0;
            bass(n[0], t0 + off * s + swing, n[2] || {});
        });
    }
    function slap() {                                   // on a flip — a quick slap→ghost→octave-pop in A
        if (!soundOn || !ctx()) return;
        play([[110, 0, {}], [110, 1, { ghost: true }], [220, 2, { pop: true, gain: 0.22 }]],
            actx.currentTime + 0.01);
    }
    var lastLickAt = 0;
    function lick() {                                   // the riff — an original A-minor funk groove
        if (!soundOn || !ctx()) return;
        var now = actx.currentTime;
        if (now - lastLickAt < 0.9) return;              // don't stack riffs on rapid clicks
        lastLickAt = now;
        play([
            // bar 1 — root/octave bounce, ghost notes, space
            [110, 0, {}], [110, 2, { ghost: true }], [220, 3, { pop: true }],
            [110, 4, {}], [130.8, 6, { pop: true }], [110, 7, { ghost: true }],
            [82.4, 8, {}], [82.4, 10, { ghost: true }], [164.8, 11, { pop: true }],
            [110, 12, {}], [110, 14, { ghost: true }],
            // bar 2 — the answer: pops climb, then drop to a low root that rings
            [220, 16, { pop: true }], [196, 18, { pop: true }], [146.8, 19, { pop: true }],
            [110, 20, {}], [130.8, 22, { pop: true }], [110, 23, { ghost: true }],
            [82.4, 24, {}], [55, 28, { dur: 0.42, gain: 0.34 }]
        ], now + 0.02);
    }

    // ── controls ────────────────────────────────────────────────────────
    els.spin.addEventListener("click", spin);
    // the knobs turn the wheel a day at a time, like the real thing
    function turnWheel(dir) {
        var i = state.day ? DAYS.indexOf(state.day) : 0;
        newExcuse(DAYS[(i + dir + 7) % 7]);
    }
    els.knobL.addEventListener("click", function () { turnWheel(-1); });
    els.knobR.addEventListener("click", function () { turnWheel(1); });
    els.another.addEventListener("click", function () { newExcuse(state.day || DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1], true); lick(); });
    els.copy.addEventListener("click", function () {
        var txt = els.excuse.textContent;
        var done = function () { var o = els.copy.textContent; els.copy.textContent = "copied ✓"; setTimeout(function () { els.copy.textContent = "copy"; }, 1400); };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done();
    });
    els.sound.addEventListener("click", function () {
        soundOn = !soundOn;
        els.sound.setAttribute("aria-pressed", soundOn ? "true" : "false");
        els.sound.textContent = soundOn ? "sound: on" : "sound: off";
        if (soundOn) { ctx(); startAmbient(); slapPreview(); }   // a taste, so you know it works
        else { stopAmbient(); }
    });
    function slapPreview() { if (soundOn && ctx()) play([[110, 0, {}], [164.8, 1, { pop: true }], [220, 1.5, { pop: true }]], actx.currentTime + 0.01); }

    // ── grit: light rain + a flickering neon tube (vfx + sfx) ─────────────
    // rain drawn to the background canvas (visual only; skipped if reduced-motion)
    (function rain() {
        if (reduced) return;
        var cv = document.getElementById("rain"); if (!cv || !cv.getContext) return;
        var g = cv.getContext("2d"); if (!g) return;
        var dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, drops = [];
        var slant = 1.1 * dpr;
        function drop(any) {
            return { x: Math.random() * W, y: any ? Math.random() * H : -20 * dpr,
                len: (10 + Math.random() * 16) * dpr, sp: (6 + Math.random() * 7) * dpr,
                a: 0.05 + Math.random() * 0.11 };
        }
        function size() {
            W = cv.width = Math.floor(innerWidth * dpr);
            H = cv.height = Math.floor(innerHeight * dpr);
            cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px";
            var n = Math.round(innerWidth / 13); drops = [];
            for (var i = 0; i < n; i++) drops.push(drop(true));
        }
        function frame() {
            g.clearRect(0, 0, W, H);
            g.lineWidth = dpr; g.lineCap = "round";
            for (var i = 0; i < drops.length; i++) {
                var d = drops[i];
                g.strokeStyle = "rgba(228,222,206," + d.a + ")";
                g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - slant, d.y - d.len); g.stroke();
                d.y += d.sp; d.x += slant * 0.18;
                if (d.y - d.len > H) drops[i] = drop(false);
            }
            requestAnimationFrame(frame);
        }
        size(); window.addEventListener("resize", size); frame();
    })();

    // the neon tube stutters; each burst fires a buzz when sound is on
    var signEl = document.querySelector(".wordmark h1");
    function buzz(strength) {
        if (!soundOn) return; var c = ctx(); if (!c) return;
        var t = c.currentTime, dur = 0.05 + 0.07 * strength;
        var o = c.createOscillator(), bp = c.createBiquadFilter(), gg = c.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(78 + Math.random() * 34, t);
        bp.type = "bandpass"; bp.frequency.value = 850 + Math.random() * 750; bp.Q.value = 6;
        gg.gain.setValueAtTime(0.0001, t);
        gg.gain.exponentialRampToValueAtTime(0.04 * strength + 0.015, t + 0.005);
        gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(bp); bp.connect(gg); gg.connect(c.destination);
        o.start(t); o.stop(t + dur + 0.02);
        if (noiseBuf) {                                  // a little electrical crackle
            var ns = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain();
            ns.buffer = noiseBuf; nf.type = "highpass"; nf.frequency.value = 2200;
            ng.gain.setValueAtTime(0.05 * strength, t);
            ng.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.7);
            ns.connect(nf); nf.connect(ng); ng.connect(c.destination);
            ns.start(t); ns.stop(t + dur);
        }
    }
    function flickerBurst() {
        if (!signEl) return;
        buzz(0.6 + Math.random() * 0.6);
        var d = 0, steps = 2 + Math.floor(Math.random() * 4);
        for (var i = 0; i < steps; i++) {
            (function (delay) {
                var out = Math.random() < 0.4;
                setTimeout(function () { signEl.classList.add(out ? "flicker--out" : "flicker"); }, delay);
                setTimeout(function () { signEl.classList.remove("flicker", "flicker--out"); }, delay + 30 + Math.random() * 55);
            })(d);
            d += 45 + Math.random() * 95;
        }
    }
    (function scheduleFlicker() {
        if (reduced) return;
        setTimeout(function () { flickerBurst(); scheduleFlicker(); }, 2800 + Math.random() * 6500);
    })();

    // ambient bed while sound is on: rain hiss + a faint mains hum
    var amb = null;
    function startAmbient() {
        var c = ctx(); if (!c || amb) return;
        amb = {};
        if (!reduced) {                                  // looping broadband rain hiss
            var rb = c.createBuffer(1, Math.floor(c.sampleRate * 2), c.sampleRate), rd = rb.getChannelData(0);
            for (var i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
            var src = c.createBufferSource(); src.buffer = rb; src.loop = true;
            var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 6500;
            var hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 520;
            var rg = c.createGain(); rg.gain.value = 0.0001;
            src.connect(hp); hp.connect(lp); lp.connect(rg); rg.connect(c.destination);
            src.start(); rg.gain.linearRampToValueAtTime(0.012, c.currentTime + 0.9);
            amb.src = src; amb.rg = rg;
        }
        var ho = c.createOscillator(); ho.type = "sine"; ho.frequency.value = 120;
        var hg = c.createGain(); hg.gain.value = 0.0001;
        ho.connect(hg); hg.connect(c.destination);
        ho.start(); hg.gain.linearRampToValueAtTime(0.007, c.currentTime + 0.9);
        amb.ho = ho; amb.hg = hg;
    }
    function stopAmbient() {
        if (!amb) return; var c = actx, t = c.currentTime, a = amb; amb = null;
        if (a.rg) a.rg.gain.linearRampToValueAtTime(0.0001, t + 0.4);
        a.hg.gain.linearRampToValueAtTime(0.0001, t + 0.4);
        setTimeout(function () { try { if (a.src) a.src.stop(); a.ho.stop(); } catch (e) {} }, 500);
    }

    // ── keyboard ─────────────────────────────────────────────────────────
    document.addEventListener("keydown", function (e) {
        var onButton = document.activeElement && document.activeElement.tagName === "BUTTON";
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            var i = state.day ? DAYS.indexOf(state.day) : -1;
            i = (i + (e.key === "ArrowRight" ? 1 : -1) + 7) % 7;
            newExcuse(DAYS[i]);
        } else if ((e.key === " " || e.key === "Enter") && !onButton) {
            e.preventDefault();
            newExcuse(state.day || "Monday");
        } else if (e.key === "s" || e.key === "S") {
            if (!onButton) { e.preventDefault(); spin(); }
        }
    });

    // start on today (or Monday on weekends' Sunday index)
    var jsDay = new Date().getDay();               // 0=Sun..6=Sat
    var startDay = DAYS[jsDay === 0 ? 6 : jsDay - 1];
    newExcuse(startDay);
})();
