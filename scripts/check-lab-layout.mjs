/* check-lab-layout.mjs — guard against the "full-bleed flush-left" layout bug.
 *
 * main.content does not constrain width; every top-level block of a page must
 * self-constrain (max-width: var(--maxw); margin-inline: auto; padding-inline:
 * gutter) or be wrapped in a container that does. A block that forgets runs
 * edge-to-edge, flush to x=0, misaligned with the nav and footer. This script
 * renders each lab page and fails if any visible top-level block starts left of
 * the nav brand's gutter, or if the page overflows horizontally.
 *
 * Usage:  node scripts/check-lab-layout.mjs [baseUrl]
 *   baseUrl defaults to https://avneeshk.me   (checks the live site)
 * Playwright is resolved from PLAYWRIGHT_PATH or the local a11y-tools install.
 */
const PW = process.env.PLAYWRIGHT_PATH || '/home/admino/a11y-tools/node_modules/playwright/index.js';
const { chromium } = (await import(PW)).default;

const BASE = process.argv[2] || 'https://avneeshk.me';
const PATHS = [
	'/lab/', '/mcp/', '/break-this-server/', '/allowlist-bypass/',
	'/tool-poisoning/', '/you-are-the-model/', '/owasp-top-10/',
];
const WIDTHS = [1280, 768, 390];
const TOL = 2; // px

const b = await chromium.launch();
let failures = 0;

for (const path of PATHS) {
	for (const width of WIDTHS) {
		const p = await b.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
		await p.goto(BASE + path, { waitUntil: 'networkidle' });
		const r = await p.evaluate((tol) => {
			const de = document.documentElement;
			const overflow = de.scrollWidth > de.clientWidth + 1;
			// gutter reference: the nav brand's left edge (the site's content axis)
			const brand = document.querySelector('.nav-brand');
			const gx = brand ? brand.getBoundingClientRect().left : 0;
			const main = document.querySelector('main.content, main#main, main');
			// The invariant is about TEXT, not boxes: an intentional full-bleed band
			// (e.g. the mcp scoreboard) spans edge-to-edge but centers its content, so
			// its text still starts at/after the gutter. Only flag rendered text runs
			// (leaf elements) that begin left of the gutter — that is the flush-left bug.
			const bad = [];
			if (main) {
				for (const el of main.querySelectorAll('*')) {
					if (el.childElementCount !== 0) continue;           // leaf only
					if (!el.textContent || !el.textContent.trim()) continue;
					const cs = getComputedStyle(el);
					if (cs.display === 'none' || cs.visibility === 'hidden') continue;
					const rect = el.getBoundingClientRect();
					if (rect.width === 0 || rect.height === 0) continue;
					if (rect.left < gx - tol) {
						bad.push({
							cls: (el.className && String(el.className).trim()) || el.tagName,
							left: Math.round(rect.left), gutter: Math.round(gx),
							text: el.textContent.trim().slice(0, 30),
						});
					}
				}
			}
			// de-dupe by class to keep output readable
			const seen = new Set(), uniq = [];
			for (const x of bad) { if (!seen.has(x.cls)) { seen.add(x.cls); uniq.push(x); } }
			return { overflow, bad: uniq };
		}, TOL);
		const tag = `${path} @${width}`;
		if (r.overflow) { console.log(`FAIL  ${tag}  horizontal overflow`); failures++; }
		for (const x of r.bad) {
			console.log(`FAIL  ${tag}  block .${x.cls} starts at x=${x.left} < gutter ${x.gutter} (flush-left)`);
			failures++;
		}
		if (!r.overflow && r.bad.length === 0) console.log(`ok    ${tag}`);
		await p.close();
	}
}
await b.close();
console.log(failures ? `\n${failures} layout failure(s)` : '\nall lab pages constrained ✓');
process.exit(failures ? 1 : 0);
