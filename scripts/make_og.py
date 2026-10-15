#!/usr/bin/env python3
"""
make_og.py — share cards (1200×630 PNG) for avneeshk.me, in the site's v3 look.

Writes to assets/og/:
  default.png              the site card (homepage and any page without its own)
  lab.png                  the lab index
  <exhibit>.png            one per entry in _data/exhibits.yml (named after its URL)
  <post-slug>.png          one per post in _posts/*.md

Paper background, Schibsted Grotesk title, Newsreader text, and a red-pen label
that echoes the homepage margin notes. Fonts are downloaded once into
scripts/.fonts/ (gitignored). Run from anywhere: python3 scripts/make_og.py
"""

import re
import sys
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow is not installed. Run: pip install pillow", file=sys.stderr)
    sys.exit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
POSTS_DIR = REPO_ROOT / "_posts"
EXHIBITS = REPO_ROOT / "_data" / "exhibits.yml"
OUTPUT_DIR = REPO_ROOT / "assets" / "og"
FONT_DIR = SCRIPT_DIR / ".fonts"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FONT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
PAD = 80
TEXT_W = W - 2 * PAD

# Same values as _sass/_site.scss
PAPER = "#f7f7f4"
INK = "#1a1a1e"
INK_SOFT = "#55565c"
BLUE = "#2340a0"
PENCIL = "#c8372d"
RULE = "#d9d9d3"

GF = "https://raw.githubusercontent.com/google/fonts/main/ofl"
FONTS = {
    "grotesk": (f"{GF}/schibstedgrotesk/SchibstedGrotesk%5Bwght%5D.ttf", "SchibstedGrotesk-wght.ttf"),
    "serif": (f"{GF}/newsreader/Newsreader%5Bopsz%2Cwght%5D.ttf", "Newsreader-opsz-wght.ttf"),
    "serif-italic": (f"{GF}/newsreader/Newsreader-Italic%5Bopsz%2Cwght%5D.ttf", "Newsreader-Italic-opsz-wght.ttf"),
}


def ensure_fonts():
    for url, name in FONTS.values():
        dest = FONT_DIR / name
        if dest.exists() and dest.stat().st_size > 50_000:
            continue
        print(f"  downloading {name}")
        urllib.request.urlretrieve(url, dest)


def font(kind, size, weight):
    """A variable font instance at a given weight (and optical size for Newsreader)."""
    f = ImageFont.truetype(str(FONT_DIR / FONTS[kind][1]), size)
    axes = f.get_variation_axes()
    values = []
    for a in axes:
        tag = a.get("name", b"")
        tag = tag.decode() if isinstance(tag, bytes) else str(tag)
        if "eight" in tag:
            values.append(weight)
        elif "ptical" in tag:
            values.append(max(a["minimum"], min(a["maximum"], size * 0.75)))
        else:
            values.append(a["default"])
    f.set_variation_by_axes(values)
    return f


def wrap(draw, text, f, max_w):
    lines, cur = [], []
    for word in text.split():
        trial = " ".join(cur + [word])
        if draw.textlength(trial, font=f) <= max_w or not cur:
            cur.append(word)
        else:
            lines.append(" ".join(cur))
            cur = [word]
    if cur:
        lines.append(" ".join(cur))
    return lines


def render(path, title, label=None, desc=None):
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    # top: name (left) and the red-pen label (right), like a margin note
    d.text((PAD, PAD - 6), "Avneesh Kasture", font=font("grotesk", 30, 700), fill=INK)
    if label:
        lf = font("serif-italic", 34, 400)
        lw = d.textlength(label, font=lf)
        x = W - PAD - lw
        d.text((x, PAD - 10), label, font=lf, fill=PENCIL)
        d.line([(x - 64, PAD + 12), (x - 16, PAD + 12)], fill=PENCIL, width=3)

    # title + description: the largest title size whose block fits between
    # the top row and the footer rule, centred in that space
    top, bottom = PAD + 70, H - PAD - 36 - 40
    for ts in range(88, 39, -4):
        tf = font("grotesk", ts, 800)
        tlines = wrap(d, title, tf, TEXT_W)
        lh = int(ts * 1.06)
        block = len(tlines) * lh
        if desc:
            df = font("serif", 32, 400)
            dlines = wrap(d, desc, df, TEXT_W - 80)[:2]
            dlh = int(32 * 1.35)
            block += 26 + len(dlines) * dlh
        if len(tlines) <= 3 and block <= bottom - top:
            break
    y = top + (bottom - top - block) // 2
    for line in tlines:
        d.text((PAD, y), line, font=tf, fill=INK)
        y += lh
    if desc:
        y += 26
        for line in dlines:
            d.text((PAD, y), line, font=df, fill=INK_SOFT)
            y += dlh

    # footer: rule + address
    d.line([(PAD, H - PAD - 36), (W - PAD, H - PAD - 36)], fill=RULE, width=2)
    d.text((PAD, H - PAD - 16), "avneeshk.me", font=font("grotesk", 26, 600), fill=BLUE)

    img.save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(REPO_ROOT)}")


def front_matter(text):
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    fm = {}
    if m:
        for key in ("title", "permalink"):
            km = re.search(rf'^{key}:\s*(.*)$', m.group(1), re.MULTILINE)
            if km:
                v = km.group(1).strip()
                if v[:1] in "\"'" and v[-1:] == v[:1]:
                    v = v[1:-1]
                fm[key] = v.replace('\\"', '"')
    return fm


def exhibits():
    """Minimal reader for _data/exhibits.yml (url / title / short per entry)."""
    items, cur = [], None
    for line in EXHIBITS.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^(-\s+|\s+)(url|title|short):\s*(.*)$", line)
        if not m:
            continue
        if m.group(1).startswith("-"):
            cur = {}
            items.append(cur)
        cur[m.group(2)] = m.group(3).strip()
    return items


def main():
    print("fonts")
    ensure_fonts()
    print("cards")
    render(OUTPUT_DIR / "default.png", "Hi, I'm Avneesh Kasture",
           desc="Associate Solutions Engineer at Gruve. Secure AI integrations for clients, and the internal tools teams use every day.")
    render(OUTPUT_DIR / "lab.png", "Six exhibits on securing AI agents", label="The lab",
           desc="Try a real attack on a live model, then see which defenses fall and which one holds.")
    for e in exhibits():
        slug = e["url"].strip("/")
        render(OUTPUT_DIR / f"{slug}.png", e["title"], label="The lab", desc=e["short"])
    for post in sorted(POSTS_DIR.glob("*.md")):
        fm = front_matter(post.read_text(encoding="utf-8"))
        m = re.match(r"^/blog/([^/]+)/?$", fm.get("permalink", ""))
        slug = m.group(1) if m else re.sub(r"^\d{4}-\d\d-\d\d-", "", post.stem)
        render(OUTPUT_DIR / f"{slug}.png", fm["title"], label="Writing")


if __name__ == "__main__":
    main()
