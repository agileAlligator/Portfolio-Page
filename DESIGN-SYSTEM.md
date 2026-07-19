# Design system — avneeshk.me · **Instrument Grade v2**

One closed system. The site is calibrated test equipment, not a terminal
costume: every mark is a claim, and the design *enacts* the security thesis
rather than illustrating it. New one-off styles are not allowed — a PreToolUse
hook (`.claude/hooks/check-design-system.py`) blocks inline `style=` and
unregistered CSS classes. `.claude/design-system.json` is the machine-readable
source of truth the hook enforces; this file is the human reference; `:root` in
`style.css` is where the tokens live. All three must agree.

> The full argument behind v2 lives in `_design-notes/instrument-grade-v2-manifesto.txt`.
> This file is the buildable contract distilled from it.

## How to change styles

- **Restyle an existing component** — edit its rules. No registration needed.
- **Add a new component** — add its class name(s) to `.claude/design-system.json`
  and document it here, *then* write the CSS. (The hook blocks the reverse order.)
- **One-off token application** — use a sanctioned utility (`.u-*`), registered
  the same way.
- **Never** compose a new colour with a raw literal or a fresh `rgba()`/`color-mix()`.
  Reach for a token. Tinted fills come **only** from the closed alpha ladder.
- **Never** use inline `style=`. Move it to a class.

## Foundations (tokens — `:root` in `style.css`)

### Ground & structure — *depth is value alone; no shadows, darker = deeper*

| Token | Value | Use |
|-------|-------|-----|
| `--bg` `--bg-2` | `#0a0b0d` `#0e1013` | page / inset panels |
| `--bg-well` | `#07080a` | recessed **evidence wells** — the deepest surface |
| `--panel` `--panel-2` | `#101317` `#14181d` | raised surfaces / chrome on a panel |
| `--line-soft` `--line` `--line-strong` | `#1a1e24` `#252a31` `#39404a` | dividers / borders / frames + dashed-asserted |
| `--line-seam` | `#43859d` | **the seam** — cyan muted to structural weight; the boundary belongs to the mechanism |

### Ink

| Token | Value | Use |
|-------|-------|-----|
| `--ink` `--ink-dim` `--ink-faint` | `#e9edf1` `#a9b1bb` `#94a0ad` | text primary / secondary / tertiary (all ≥AA on `--panel`) |
| `--ink-on-acc` | `#06110c` | the one legal ink on solid green |
| `--plate` | `#626b77` | faint plate numerals (clears 3:1 large-text) |

### Accent semantics — *load-bearing; never decoration*

| Token | Value | Meaning |
|-------|-------|---------|
| `--acc` / `--acc-hi` | `#4fe3a1` / `#6bf0b4` | **green · outcome-good**: verified / live / held / primary. Only what the *server* confirmed. `-hi` = hover/active. |
| `--acc-2` | `#4cc9f0` | **cyan · the mechanism**: the deterministic layer, the blueprint. Owns the seam, tool chrome, sweep. **Never a verdict.** |
| `--warn` | `#f5b544` | **amber · the asset**: the thing at stake — preserved, or in caution. |
| `--bad` / `--bad-hi` | `#ff6b6b` / `#ff9a9a` | **red · outcome-bad**: leak / breach / attack. `-hi` = red text needing contrast on dark. |
| `--paper` | `#e3e1d1` | **the record**: stamps, timestamps, `::selection` (selecting is citing). |
| *(the model)* | *— no token —* | The model is the medium, not a category, so it has **no hue**. Its register is texture: `.asserted` (dashed). |

### The closed alpha ladder — *the only tinted-territory fills*

`100%` is a verdict · `14%` is an active zone · `8%` is a resting zone · `5%` is
the substrate grid. **Nothing between 15% and 99% — half-committed colour is a
vibe.** Every fill is one of these eight tokens; no bespoke `rgba()`/`color-mix()`.

| Resting (8%) | Active (14%) |
|--------------|--------------|
| `--field-acc` `--field-acc2` `--field-warn` `--field-bad` | `--field-acc-on` `--field-acc2-on` `--field-warn-on` `--field-bad-on` |

### Type / space

`--disp` Martian Mono (the instrument voice) · `--mono` IBM Plex Mono · `--sans`
IBM Plex Sans · `--maxw 1200px`. *(A discrete `--fs`/`--sp` scale is being
adopted across all files as a dedicated pass; until then, sizes are per-file.)*

### Motion — *three verbs only; the ghost glides, the gate ticks*

| Token | Value | Verb |
|-------|-------|------|
| `--ease` | `cubic-bezier(.22,1,.36,1)` | model-side / continuous / human-input affordances |
| `--ease-strike` | `cubic-bezier(.2,0,0,1)` | **the strike** — verdict lands, hard decel, no overshoot |
| `--step` | `steps(6,end)` | **the tick** — the control is never *between* states |
| `--t-strike` `--t-tick` `--t-sweep` | `120ms` `200ms` `480ms` | strike / tick / one measurement pass |

**Motion laws:** default is stillness (no parallax, scroll-reveals kept minimal,
no hover-lifts). Smooth easing is model-side; anything the *control* does moves
in `steps()` or not at all. Nothing loops but the cursor blink and a pending
sweep. The instant a verdict exists, motion in that panel stops — verdicts do
not shimmer. All motion is gated behind `@media (prefers-reduced-motion: reduce)`.

## Primitives (v2) — the shared instrument grammar

Defined **once** in `style.css`; every exhibit composes them instead of
re-inventing a surface.

- **`.well`** — a recessed evidence surface (`--bg-well`, mono): raw logs,
  transcripts, machine readouts. Replaces all bespoke dark log/terminal-body fills.
- **`.asserted`** — the model's register: `1px dashed`. Put it on any surface
  showing model-generated / unverified text. Solid borders = proven.
- **`.seam`** (`.seam-model` / `.seam-line` / `.seam-ctrl`) — the boundary where
  model output meets a control. One line in `--line-seam`; the model side dashed,
  the control side solid; never a gradient across it.
- **`.reg`** — persistent registration ticks marking a panel as a working
  instrument. Earned by interactivity; never on prose/marketing panels.
- **Verdict `.stamp`/strike** — verdicts land once via `--t-strike`/`--ease-strike`
  (`.verdict` strikes block-level; per-exhibit stamp glyphs punch square). Square,
  axis-aligned, no rotation — identical-every-time is the testimony.

## Design laws

1. Every mark is a claim. If it asserts nothing, it comes off the page.
2. Solid is proven; dashed is asserted. The model gets dashes.
3. The ghost glides; the gate ticks. Continuous motion is model-side; the control moves in steps.
4. Cyan never wins or loses. Outcomes are green or red; cyan is the mechanism.
5. Full-strength colour is a verdict; 8% is a territory. Nothing in between.
6. The seam is drawn, never blended. Gradients lie about architecture.
7. The dressing never exceeds the evidence. Instrument chrome must be earned by a panel that actually runs.

## Component catalogue

Files: `style.css` (site-wide + primitives), `assets/mcp.css`, `assets/game.css`,
`assets/ytm.css`, `assets/toolpoison.css`, `assets/allowlist.css`,
`assets/owasp.css`, `assets/lab.css`, `assets/blog.css`, `assets/syntax.css`
(Rouge highlighting — generated).

- **Layout** — `.section`, `.section-title`, `.section-label`, `.content`, `.section-contact`.
- **Nav / footer** — `.nav`, `.nav-brand`, `.nav-links`, `.nav-resume`, `.nav-toggle`,
  `.nav-out`; `.footer`, `.site-footer`, `.site-footer-links`, `.sys-status`. Brand uses `.prompt` + `.blink`.
- **Buttons** — `.btn`, `.btn-primary`. The only two.
- **Cards** — `.cards` grid of `.card`; `.card-feature`, `.card-mini`; parts
  `.card-top` `.card-idx` `.card-tags` `.card-title` `.card-at` `.card-desc` `.card-links` `.card-lock`.
- **The figure (instrument readout)** — `.term`, `.term-bar` (`.term-led`,
  `.term-fig`, `.term-title`), `.term-body`; spans `.c-dim` `.c-key` `.c-str`
  `.c-ok` `.c-bad`, `.cursor`.
- **Hero** — `.hero`, `.hero-kicker`, `.hero-title`, `.hero-rev`, `.hero-role`
  (`.tag`, `.slash`), `.hero-blurb`, `.hero-cta`, `.hero-glow`.
- **Approach / case study / timeline / skills / creds / contact** — as before
  (`.approach*`, `.cs*`, `.timeline`/`.tl-*`, `.skills-grid`/`.skill-group`,
  `.creds`/`.cred`, `.contact-title`/`.contact-links`).
- **Exhibits** — OWASP prism (`.asi-*`, `.owasp-*`), Break-this-server
  (`.game-*`, `.rung*`, `.rig*`, `.attack*`, `.presets`, `.score`, `.game-stamp`),
  You-are-the-model (`.ytm-*`), Tool-poisoning (`.tp-*`), Allowlist (`.al-*`),
  MCP console (`.mcp-*`). Each composes the v2 primitives above for its wells,
  seams, verdicts and registration marks.
- **Verdicts** — base `.verdict` (+ `.verdict-block`, `.verdict-win`); per-exhibit
  variants compose the strike.
- **Utilities** — `.u-accent`, `.u-warn`, `.u-mt-lg`, `.u-sr-only`. The complete set; keep it tiny.
- **Runtime/state** (JS-added) — `.js` `.active` `.on` `.in` `.spin` `.open`.

## Conversion status (v2 rollout)

Refactor-and-delete, never add-in-parallel. Each commit fully converts what it touches.

- ✅ **Foundation** — `:root` locked; `style.css` converted (literals→tokens,
  alpha ladder, radii→0, verdict strike, primitives defined).
- ⬜ Exhibit files → convert bespoke fills to the ladder, surfaces to `.well`,
  verdicts to the strike, model text to `.asserted`, add seams / reg marks.
- ⬜ `--fs`/`--sp` scale — adopt across all files in one consistent sweep.

## Enforcement

`.claude/settings.json` registers the PreToolUse hook on `Edit|Write|MultiEdit`.
It reads `.claude/design-system.json` and blocks (exit 2) any edit adding an
inline `style=` to HTML or a CSS class not on the list. Register intentional new
classes there first.
