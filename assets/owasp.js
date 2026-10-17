(function () {
	var cards = document.querySelectorAll(".asi-card");

	var NAMES = ["attack", "detection", "control"];

	cards.forEach(function (card, ci) {
		var prism = card.querySelector(".asi-prism");
		var faces = [card.querySelector(".face-risk"), card.querySelector(".face-detect"), card.querySelector(".face-control")];
		var btn = card.querySelector(".asi-turn");
		var status = card.querySelector("[role=status]");
		var idn = (card.getAttribute("aria-label") || "").replace(" — ", " ");   // "ASI01 Agent Goal Hijack"
		// id each face's body so the control can describe the visible face on focus
		var bodies = faces.map(function (f, i) { var el = f.querySelector(".asi-attack, .asi-body"); if (el) el.id = "asi-b-" + ci + "-" + i; return el; });
		if (btn && bodies[0]) btn.setAttribute("aria-describedby", bodies[0].id);   // attack visible at load

		function rotate(dir) {                        // dir: +1 forward (right), -1 back (left)
			var rot = parseInt(card.dataset.rot || "0", 10) - dir * 120;   // right → detection → control (turns rightward)
			card.dataset.rot = rot;
			prism.style.transform = "translateZ(-86.6px) rotateY(" + rot + "deg)";
			card.classList.remove("spin");
			void card.offsetWidth;                    // restart the pulse animation
			card.classList.add("spin");
			// a11y: expose only the current face, retitle + describe the control, announce the change
			var idx = ((-rot / 120) % 3 + 3) % 3;     // 0 attack · 1 detection · 2 control
			faces.forEach(function (f, i) { if (i === idx) f.removeAttribute("aria-hidden"); else f.setAttribute("aria-hidden", "true"); });
			if (btn) {
				btn.setAttribute("aria-label", "Turn to " + NAMES[(idx + 1) % 3] + " — " + idn);
				if (bodies[idx]) btn.setAttribute("aria-describedby", bodies[idx].id);
			}
			if (status) status.textContent = faces[idx].querySelector(".asi-label").textContent + ": " + faces[idx].querySelector(".asi-attack, .asi-body").textContent;
		}

		card.addEventListener("click", function (e) {
			if (e.detail === 0) { rotate(1); return; }   // keyboard Enter/Space → forward
			var rect = card.getBoundingClientRect();
			rotate((e.clientX - rect.left) > rect.width / 2 ? 1 : -1);
		});
		card.addEventListener("keydown", function (e) {
			if (e.key === "ArrowRight") { e.preventDefault(); rotate(1); }
			else if (e.key === "ArrowLeft") { e.preventDefault(); rotate(-1); }
		});

		card.addEventListener("mousemove", function (e) {   // cursor-tracking spotlight
			var rect = card.getBoundingClientRect();
			card.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width * 100) + "%");
			card.style.setProperty("--my", ((e.clientY - rect.top) / rect.height * 100) + "%");
		});
	});

	if ("IntersectionObserver" in window) {              // staggered entrance
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en, i) {
				if (en.isIntersecting) {
					en.target.style.transitionDelay = Math.min(i * 55, 300) + "ms";
					en.target.classList.add("in");
					io.unobserve(en.target);
				}
			});
		}, { threshold: 0.15 });
		cards.forEach(function (c) { io.observe(c); });
	} else {
		cards.forEach(function (c) { c.classList.add("in"); });
	}
})();
