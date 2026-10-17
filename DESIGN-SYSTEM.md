# Design system — avneeshk.me (v3)

The site is about Avneesh, a person, not about one idea. It reads like a
well-edited profile: a light page, a reading serif, a confident grotesk, and
on the homepage a margin of short asides in his voice. The lab exhibits keep
their instrument grammar inside each exhibit, drawn in the same palette and type.

`.claude/design-system.json` is the machine-readable class registry the
PreToolUse hook enforces (`.claude/hooks/check-design-system.py`): no inline
`style=`, and no CSS class definition that isn't registered. Register first,
then write the CSS.

## Files

| File | Role |
|------|------|
| `_sass/_site.scss` | Shared by every page: fonts, palette, base, masthead, breadcrumb, wayfinding, footer index |
| `assets/home.scss` | Homepage only (`index.html`): the row + margin layout and margin notes |
| `style.scss` | Lab + blog: the instrument kit (tokens, `.card`, `.btn`, `.term`, `.well`, verdicts, primitives) |
| `assets/blog.scss` | Blog index and posts (reading column) |
| `assets/syntax.scss` | Rouge highlighting, light |
| `assets/{mcp,game,owasp,allowlist,toolpoison,ytm,lab}.scss` | One per exhibit, composing `style.scss` |

## Palette (`_sass/_site.scss`)

| Token | Value | Use |
|-------|-------|-----|
| `--paper` | `#f7f7f4` | page background (cool, not cream) |
| `--ink` | `#1a1a1e` | text |
| `--ink-soft` | `#55565c` | meta lines, footer |
| `--blue` / `--blue-deep` | `#2340a0` / `#172b70` | links and actions / hover |
| `--pencil` | `#c8372d` | **margin notes only** |
| `--rule` | `#d9d9d3` | dividers |

**Dark mode** follows `prefers-color-scheme` (no toggle). Every token above, and
every instrument token in `style.scss`, has a dark value in a
`@media (prefers-color-scheme: dark)` block next to its light definition. Never
write a raw colour in a component: add or reuse a token so both themes get it.
`assets/syntax.scss` carries its own dark palette.

## Type

- **Schibsted Grotesk** (`--grotesk`) — names, headings, nav, meta, UI.
- **Newsreader** (`--serif`) — reading text. Its italic in `--pencil` is the margin-note voice.
- **IBM Plex Mono** (`--mono`) — code and machine evidence only. Never as personality.
- Sentence case everywhere. No all-caps labels, no `// eyebrow` labels above headings.

## Layout

- `--frame: 70rem` + `--gutter` is the one content width. Masthead, exhibits,
  wayfinding and the footer index all use it, so every page shares a left edge.
- Homepage `.row` = `.row-main` (40rem) + margin (13.5rem), left-aligned in the frame.
- Blog uses a centred 40rem reading column under the same masthead.
- Numbering only where content is a real sequence (the career path).

## Wayfinding (how buried pages surface)

- **Footer index** (`_includes/site-index.html`) on every page except the homepage (which lists the lab and writing itself and ends on contact): all six exhibits,
  the five latest posts, contact. Every page is one click from anywhere.
- **Exhibits** get a breadcrumb back to the lab and previous/next exhibit links,
  driven by `_data/exhibits.yml` (order, title, one-line description).
- **Posts** list related exhibits ("Try it yourself", via `exhibits:` front matter)
  and link to the older/newer post. `short_title:` is used in compact lists.
- The homepage lab and writing lists render from the same data.

To add an exhibit: add it to `_data/exhibits.yml` and `scripts/check-lab-layout.mjs`.
To add a post: give it `short_title:` and, where one fits, `exhibits:`.
Then run `python3 scripts/make_og.py` to regenerate the share cards (default,
lab, every exhibit, every post) in the v3 look.

## Exercise answers

A post that ends with an **Exercise** gets a collapsed answer under it, through
`_includes/answer.html` (a native `<details class="post-answer">`, closed by default):

```liquid
{% capture answer %}Markdown answer, `code` and [links](https://…) allowed.{% endcapture %}
{% include answer.html body=answer %}
```

## Images in posts

Every post image goes through `_includes/figure.html`, which renders a
`<figure class="post-figure">` with a `<figcaption>`. Images and diagrams live in
`assets/blog/<slug>/`.

```liquid
{% capture alt %}What the image shows.{% endcapture %}
{% capture caption %}Caption in markdown, [links](https://…) allowed.{% endcapture %}
{% include figure.html src="/assets/blog/<slug>/name.svg" alt=alt caption=caption %}
```

Never write a raw `![alt](src)` with an italic caption line under it. Markdown
merges the two into one paragraph with an inline `<img>`, and the caption flows
beside any image narrower than the 40rem column. The PreToolUse hook blocks raw
markdown images in `_posts/` and `_drafts/`, and `.post-body img` is
`display: block` as a backstop.

## Building like GitHub Pages does

Pages builds with the github-pages gem (Jekyll 3.10, **Ruby Sass 3.7**). Old Sass
evaluates bare arithmetic, so write `clamp(1rem, calc(1rem + 2vw), 3rem)`, never
`clamp(1rem, 1rem + 2vw, 3rem)`, and avoid `/` inside shorthands. Check a
change with the github-pages gem set before pushing, then confirm the build
via the Pages API.

## Lab instrument kit (`style.scss`)

Exhibit tokens keep their meanings; their values are re-cut for the light page.

| Token | Meaning |
|-------|---------|
| `--acc` `#13744a` | outcome-good: verified, held, primary action |
| `--acc-2` `#1f5f8b` | the mechanism (the deterministic layer). Never a verdict |
| `--warn` `#8a5a00` | the asset at stake |
| `--bad` `#b42318` | outcome-bad: leak, breach, attack |
| `--bg-well` / `--panel` / `--panel-2` | recessed evidence / raised surface / chrome on a panel |
| `--field-*` / `--field-*-on` | the only tinted fills: resting / active |

Primitives, defined once: `.well` (evidence surface), `.asserted` (dashed =
model-generated), `.seam` (model output meets a control), `.reg` (registration
ticks on working instruments), `.verdict` + the strike animation. Motion stays
minimal and is gated behind `prefers-reduced-motion`.

`node scripts/check-lab-layout.mjs [baseUrl]` renders every exhibit at
1280/768/390 and fails on horizontal overflow or text left of the masthead.

## Corrections

Standing policy: when a published post turns out to be wrong, fix it, say so
on the post, and log it on `/blog/corrections/` (`corrections.html`). Only text
that was live and later changed for accuracy counts. Copy-edits, voice
rewrites and image changes don't. Compare the published versions in the
history of `_posts/` with the push times in the reflog of `origin/master`
before logging, and say how long the wrong version was live when it was short.

Log it in the affected post's front matter, one entry per error:

```yaml
corrections:
  - date: 2026-10-17          # when corrected
    kind: "Overstated"        # groups the page: "Overtaken by events", "Overstated", "Wrong attribution", "Unsupported claim", "Wrong detail", or a new plain label
    text: >-
      One or two plain sentences: what the post said, what it says now.
```

The page groups entries by `kind` and gives each an anchor,
`#c-<post slug>-<n>` (n is the entry's position in that post's list).
`_includes/post-corrected.html` (one line in `_layouts/post.html`) adds
"Corrected <latest date>" to the post meta, linking to the post's first entry.
A dated blockquote at the top of the post is optional and is for corrections
that change the post's main claim. Classes: `corrections-*` and
`post-corrected`, in `assets/blog.scss`.
