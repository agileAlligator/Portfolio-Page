# Design system — avneeshk.me

The site draws from one closed set of tokens and components. New one-off styles
are not allowed: a PreToolUse hook (`.claude/hooks/check-design-system.py`)
blocks inline `style=` and unregistered CSS classes. This file is the human
reference; `.claude/design-system.json` is the machine-readable source of truth
the hook enforces against.

## How to change styles

- **Restyle an existing component** — edit its rules in the CSS file below. No
  registration needed; the class already exists.
- **Add a new component** — add its class name(s) to `.claude/design-system.json`
  and document it here, *then* write the CSS. (The hook blocks the reverse order.)
- **One-off token application** — use a sanctioned utility (`.u-*`). Add new
  utilities the same way (register first).
- **Never** use inline `style=`. There is no exception; move it to a class.

## Foundations (tokens — `:root` in `style.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` `--bg-2` | `#0b0e14` `#10141d` | page / inset backgrounds |
| `--panel` `--panel-2` | `#131824` `#171d2b` | cards, terminals, raised surfaces |
| `--line` `--line-soft` | `#232b3a` `#1a2130` | borders / dividers |
| `--ink` `--ink-dim` `--ink-faint` | `#e6ebf2` `#9aa6b8` `#7f8a9e` | text (primary / secondary / tertiary, all ≥AA on `--bg`) |
| `--acc` | `#4fe3a1` phosphor green | primary accent, "safe/control" |
| `--acc-2` | `#4cc9f0` cyan | links, kickers, "the wall" |
| `--warn` `--bad` | `#f5b544` `#ff6b6b` | caution / danger, "attack" |
| `--mono` `--sans` | IBM Plex Mono / Sans | code+UI chrome / body |
| `--maxw` | `1120px` | content column width |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | all transitions |

Motion is always gated behind `@media (prefers-reduced-motion: reduce)`.

## Component catalogue

Files: `style.css` (site-wide), `assets/blog.css` (blog), `assets/owasp.css`
(OWASP prism), `assets/game.css` (Break-this-server), `assets/syntax.css`
(Rouge highlighting — generated, don't hand-edit).

- **Layout** — `.section`, `.section-title`, `.section-label` (the `// 0N ·`
  kicker), `.content`, `.section-contact`.
- **Nav / footer** — `.nav`, `.nav-brand`, `.nav-links`, `.nav-resume`,
  `.nav-toggle`, `.nav-out`; `.footer`, `.site-footer`, `.site-footer-links`.
  Brand mark uses `.prompt` + `.blink`.
- **Buttons** — `.btn`, `.btn-primary`. The only two button styles. Any clickable
  that looks like a button uses these.
- **Cards** — `.cards` grid of `.card`; variants `.card-feature`, `.card-mini`;
  parts `.card-top`, `.card-idx`, `.card-tags`, `.card-title`, `.card-at`,
  `.card-desc`, `.card-links`, `.card-lock`.
- **Terminal** — `.term`, `.term-bar` (+ `.dot`, `.term-title`), `.term-body`;
  syntax spans `.c-dim` `.c-key` `.c-str` `.c-ok` `.c-bad`, plus `.cursor`.
  Reused by the hero and the game console (`.game-term`, `.game-console`,
  `.cline`).
- **Chips / tags** — `.card-tags` (inline meta), `.tool` (+ `.tool-hot`,
  `.tool-gone`), `.preset`, `.post-tags`. Pill/tag styling lives here; don't
  invent new chip classes.
- **Links (inline accent)** — `.approach-more`, `.cs-try` (green `--acc` links).
  Prose/cyan links are styled per-context in `.game-*`, `.owasp-hint`,
  `.pli-*`. When adding a link treatment, reuse one of these.
- **Hero** — `.hero`, `.hero-inner`, `.hero-kicker`, `.hero-title`, `.hero-role`
  (+ `.tag`, `.slash`), `.hero-blurb`, `.hero-cta`, `.hero-glow`.
- **Approach / case study** — `.approach` (`.approach-step`, `.approach-num`),
  `.cs` (`.cs-lede`, `.cs-sub`, `.cs-map`, `.cs-threat`, `.cs-ctrl`, `.cs-outcome`,
  `.cs-note`, `.cs-try`).
- **Experience timeline** — `.timeline`, `.tl-item`, `.tl-head`, `.tl-org`,
  `.tl-meta`, `.tl-desc`.
- **Skills / creds** — `.skills-grid`, `.skill-group`; `.creds`, `.cred`.
- **Contact** — `.contact-title`, `.contact-links`.
- **OWASP prism** — `.asi-grid`, `.asi-card`, `.asi-prism`, `.asi-face`
  (`.face-risk` / `.face-detect` / `.face-control`), `.asi-code`, `.asi-name`,
  `.asi-label`, `.asi-attack`, `.asi-body`; `.owasp-intro`, `.owasp-title`,
  `.owasp-lede`, `.owasp-hint`.
- **Break-this-server game** — `.game`, `.game-intro`, `.game-title`,
  `.game-lede`, `.game-sub`, `.game-grid`, `.game-foot`; ladder `.rungs`,
  `.rung` (`.rung-code`, `.rung-name`, `.rung-desc`); `.rig` (`.rig-label`,
  `.rig-explain`, `.rig-tools`); `.attack` (`.attack-label`, `.attack-input`,
  `.attack-actions`), `.presets`, `.score`; verdict `.verdict`
  (`.verdict-win` / `.verdict-block`).
- **Blog** — `.blog-index`, `.blog-title`, `.blog-intro`, `.blog-empty`;
  `.post-list`, `.post-list-item`, `.pli-main`, `.pli-title`, `.pli-sub`;
  `.post-header`, `.post-kicker`, `.post-title`, `.post-subtitle`, `.post-meta`,
  `.post-body`, `.post-footer`, `.post-tags`.
- **MCP rung scoreboard** — `.mcp-rung-grid` (two-up L0/L3 cards), `.mcp-rung-card` (per-rung tile), `.mcp-rung-num` (big leaked count), `.mcp-rung-label` (rung name chip), `.mcp-rung-effect` (leaked/held badge).
- **MCP attack box** — `.mcp-attack-box` (direct toggle demo wrapper), `.mcp-toggle` + `.mcp-toggle-btn` (L0⇄L3 segmented control), `.mcp-path-row` (input+button row), `.mcp-path-input` (path text input), `.mcp-path-presets` + `.mcp-path-preset` (quick-fill path buttons), `.mcp-line-leak` / `.mcp-line-hold` (red/green terminal output lines).
- **MCP tool surface** — `.mcp-tool-surface` (single-tool explanation panel).
- **MCP diff** — `.mcp-diff` (L0 vs L3 side-by-side container), `.mcp-diff-col` (one column), `.mcp-diff-head` (column heading bar).
- **MCP feed extras** — `.mcp-feed-rung` (rung badge), `.mcp-feed-effect` (leaked/held badge in recent-attempts feed).
- **Utilities** — `.u-accent` (text `--acc`), `.u-warn` (text `--warn`),
  `.u-mt-lg` (top margin `2rem`). The complete utility set; keep it tiny.
- **Runtime/state** (added by JS, not authored in HTML) — `.js`, `.active`,
  `.on`, `.in`, `.spin`, `.revealed`, `.is-visible`, `.open`, `.no-js`.

## Enforcement

`.claude/settings.json` registers the PreToolUse hook on `Edit|Write|MultiEdit`.
It reads `.claude/design-system.json` and blocks (exit 2) any edit that adds an
inline `style=` to HTML or a CSS class not on the list. Regenerate the manifest
after intentional changes by re-running the audit, or hand-edit it — it is just
`{ "classes": [ … ] }` plus notes.
