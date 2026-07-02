// Mobile nav toggle for blog pages (homepage has this in main.js).
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");

if (nav && toggle) {
	const close = () => {
		nav.classList.remove("open");
		toggle.setAttribute("aria-expanded", "false");
	};

	toggle.addEventListener("click", () => {
		const open = nav.classList.toggle("open");
		toggle.setAttribute("aria-expanded", String(open));
	});

	// close after choosing a destination, and on Escape (keyboard a11y)
	nav.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", close));
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && nav.classList.contains("open")) {
			close();
			toggle.focus();
		}
	});
}
