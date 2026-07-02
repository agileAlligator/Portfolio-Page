// ── Scroll reveal ────────────────────────────────────────────────
const reveals = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
	const io = new IntersectionObserver(
		(entries) => {
			entries.forEach((e, i) => {
				if (e.isIntersecting) {
					// small stagger for siblings entering together
					e.target.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
					e.target.classList.add("in");
					io.unobserve(e.target);
				}
			});
		},
		{ threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
	);
	reveals.forEach((el) => io.observe(el));
} else {
	reveals.forEach((el) => el.classList.add("in"));
}

// ── Mobile nav toggle ────────────────────────────────────────────
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
toggle?.addEventListener("click", () => {
	const open = nav.classList.toggle("open");
	toggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll(".nav-links a").forEach((a) =>
	a.addEventListener("click", () => {
		nav.classList.remove("open");
		toggle.setAttribute("aria-expanded", "false");
	})
);

// ── Active section highlight ─────────────────────────────────────
const sections = document.querySelectorAll("section[id]");
const navLinks = new Map(
	[...document.querySelectorAll(".nav-links a")].map((a) => [
		a.getAttribute("href").slice(1),
		a,
	])
);
if ("IntersectionObserver" in window) {
	const spy = new IntersectionObserver(
		(entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) {
					navLinks.forEach((a) => a.classList.remove("active"));
					navLinks.get(e.target.id)?.classList.add("active");
				}
			});
		},
		{ rootMargin: "-45% 0px -50% 0px" }
	);
	sections.forEach((s) => spy.observe(s));
}
