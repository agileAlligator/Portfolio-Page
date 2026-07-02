#!/usr/bin/env python3
"""
make_og.py — Static Open Graph image generator for avneeshk.me Jekyll blog.

Generates 1200×630 PNGs in assets/og/ for every post in _posts/*.md,
plus a site default assets/og/default.png.

Run from anywhere; paths are resolved relative to this script's parent dir.
"""

import os
import re
import sys
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow is not installed. Run: pip install pillow", file=sys.stderr)
    sys.exit(1)

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).resolve().parent
REPO_ROOT    = SCRIPT_DIR.parent
POSTS_DIR    = REPO_ROOT / "_posts"
OUTPUT_DIR   = REPO_ROOT / "assets" / "og"
FONT_DIR     = SCRIPT_DIR / ".fonts"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FONT_DIR.mkdir(parents=True, exist_ok=True)

# ── Dimensions ────────────────────────────────────────────────────────────────
W, H      = 1200, 630
PAD       = 72          # outer padding on all sides
ACCENT_W  = 8           # phosphor-green left-edge bar width
TEXT_LEFT = PAD + ACCENT_W + 24   # text starts after accent bar + gap
TEXT_MAX_W = W - TEXT_LEFT - PAD  # ~1040px

# ── Colors ────────────────────────────────────────────────────────────────────
BG_COLOR      = "#0b0e14"
ACCENT_COLOR  = "#4fe3a1"   # phosphor green
KICKER_COLOR  = "#4cc9f0"   # cyan
TITLE_COLOR   = "#e6ebf2"
FOOTER_COLOR  = "#9aa6b8"
FOOTER_R_COLOR = "#5a6478"

# ── Font URLs (Google Fonts open-source repo) ─────────────────────────────────
FONT_SPECS = [
    {
        "name": "IBMPlexMono-SemiBold",
        "urls": [
            "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf",
        ],
        "fallback_name": "IBMPlexMono-Medium",
    },
    {
        "name": "IBMPlexMono-Regular",
        "urls": [
            "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf",
            "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Text.ttf",
        ],
        "fallback_name": "IBMPlexMono-Text",
    },
]

FONT_PATHS = {}   # populated by ensure_fonts()


def ensure_fonts():
    """Download TTFs into scripts/.fonts/ if not already present."""
    for spec in FONT_SPECS:
        # Try the primary name first, then fallback name
        candidate_names = [spec["name"], spec["fallback_name"]]
        found_path = None
        for cname in candidate_names:
            p = FONT_DIR / f"{cname}.ttf"
            if p.exists() and p.stat().st_size > 50_000:
                found_path = p
                FONT_PATHS[spec["name"]] = p
                print(f"  Font cached: {p.name}")
                break

        if found_path:
            continue

        # Download
        downloaded = False
        for url in spec["urls"]:
            dest_name = url.split("/")[-1]
            dest = FONT_DIR / dest_name
            print(f"  Downloading {url} …", end=" ")
            try:
                urllib.request.urlretrieve(url, dest)
                if dest.stat().st_size < 50_000:
                    print(f"WARN: file too small ({dest.stat().st_size} bytes), skipping")
                    dest.unlink(missing_ok=True)
                    continue
                print(f"OK ({dest.stat().st_size:,} bytes) → {dest.name}")
                FONT_PATHS[spec["name"]] = dest
                downloaded = True
                break
            except Exception as e:
                print(f"FAILED: {e}")

        if not downloaded:
            print(f"  ERROR: could not obtain font for '{spec['name']}'. Using Pillow default.", file=sys.stderr)
            FONT_PATHS[spec["name"]] = None


def load_font(key: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = FONT_PATHS.get(key)
    if path and path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def parse_front_matter(text: str) -> dict:
    """Extract YAML front matter fields (title, subtitle, permalink) with minimal parsing."""
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return {}
    fm_text = m.group(1)

    result = {}

    # title (handles quoted and unquoted)
    tm = re.search(r'^title:\s*["\']?(.*?)["\']?\s*$', fm_text, re.MULTILINE)
    if tm:
        result["title"] = tm.group(1).strip().strip('"\'')

    # subtitle
    sm = re.search(r'^subtitle:\s*["\']?(.*?)["\']?\s*$', fm_text, re.MULTILINE)
    if sm:
        result["subtitle"] = sm.group(1).strip().strip('"\'')

    # permalink
    pm = re.search(r'^permalink:\s*(\S+)', fm_text, re.MULTILINE)
    if pm:
        result["permalink"] = pm.group(1).strip()

    return result


def slug_from_permalink(permalink: str) -> str:
    """Extract slug from /blog/<slug>/ → <slug>."""
    m = re.match(r"^/blog/([^/]+)/?$", permalink)
    if m:
        return m.group(1)
    return None


def slug_from_filename(filename: str) -> str:
    """Derive slug from 2026-07-02-my-post-title.md → my-post-title."""
    stem = Path(filename).stem
    m = re.match(r"^\d{4}-\d{2}-\d{2}-(.+)$", stem)
    return m.group(1) if m else stem


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    """Word-wrap text into lines that fit within max_width pixels."""
    words = text.split()
    lines = []
    current = []

    for word in words:
        test = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]

    if current:
        lines.append(" ".join(current))

    return lines


def fit_title(draw: ImageDraw.ImageDraw, title: str, max_width: int,
              start_size: int = 66, min_size: int = 28, max_lines: int = 3):
    """Find largest font size where title fits in max_lines at max_width."""
    size = start_size
    while size >= min_size:
        font = load_font("IBMPlexMono-SemiBold", size)
        lines = wrap_text(draw, title, font, max_width)
        if len(lines) <= max_lines:
            return font, lines, size
        size -= 4

    # Last resort: force at min_size (may exceed max_lines)
    font = load_font("IBMPlexMono-SemiBold", min_size)
    lines = wrap_text(draw, title, font, max_width)
    return font, lines[:max_lines], min_size


def render_card(title: str, output_path: Path) -> None:
    """Render a 1200×630 OG image card."""
    img  = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # ── Left-edge phosphor-green accent bar ───────────────────────────────────
    # Full-height bar, PAD inset from left
    bar_x = PAD
    draw.rectangle([bar_x, PAD, bar_x + ACCENT_W, H - PAD], fill=ACCENT_COLOR)

    # ── Kicker: "// avneeshk.me" ──────────────────────────────────────────────
    kicker_font = load_font("IBMPlexMono-Regular", 22)
    kicker_y    = PAD + 4
    draw.text((TEXT_LEFT, kicker_y), "// avneeshk.me", font=kicker_font, fill=KICKER_COLOR)

    # ── Title ─────────────────────────────────────────────────────────────────
    title_font, title_lines, used_size = fit_title(draw, title, TEXT_MAX_W)
    line_height  = int(used_size * 1.30)
    title_top    = kicker_y + 46   # below kicker

    for i, line in enumerate(title_lines):
        draw.text((TEXT_LEFT, title_top + i * line_height),
                  line, font=title_font, fill=TITLE_COLOR)

    title_block_bottom = title_top + len(title_lines) * line_height

    # ── Separator thin line ───────────────────────────────────────────────────
    sep_y = title_block_bottom + 30
    draw.line([(TEXT_LEFT, sep_y), (W - PAD, sep_y)], fill="#1e2530", width=1)

    # ── Footer row ────────────────────────────────────────────────────────────
    footer_font  = load_font("IBMPlexMono-Regular", 22)
    footer_y     = H - PAD - 32

    draw.text((TEXT_LEFT, footer_y),
              "Avneesh Kasture", font=footer_font, fill=FOOTER_COLOR)

    right_label = "secure MCP · agentic security"
    rbbox = draw.textbbox((0, 0), right_label, font=footer_font)
    rw = rbbox[2] - rbbox[0]
    draw.text((W - PAD - rw, footer_y),
              right_label, font=footer_font, fill=FOOTER_R_COLOR)

    img.save(output_path, "PNG")
    print(f"  Written: {output_path}  [{img.width}×{img.height}]")


def process_posts():
    post_files = sorted(POSTS_DIR.glob("*.md"))
    if not post_files:
        print("No posts found in _posts/")
        return

    slugs_generated = []
    for post_file in post_files:
        text = post_file.read_text(encoding="utf-8")
        fm = parse_front_matter(text)

        if not fm.get("title"):
            print(f"  SKIP {post_file.name}: no title in front matter")
            continue

        title = fm["title"]

        # Determine slug
        if fm.get("permalink"):
            slug = slug_from_permalink(fm["permalink"])
        else:
            slug = None
        if not slug:
            slug = slug_from_filename(post_file.name)

        output_path = OUTPUT_DIR / f"{slug}.png"
        print(f"  Processing: {post_file.name} → {output_path.name}")
        render_card(title, output_path)
        slugs_generated.append(slug)

    return slugs_generated


def process_default():
    default_title = "Secure MCP Engineer · Professional Services"
    output_path = OUTPUT_DIR / "default.png"
    print(f"  Rendering default card …")
    render_card(default_title, output_path)


def verify_dimensions():
    print("\n── Verification ─────────────────────────────────────────────────────────")
    for png in sorted(OUTPUT_DIR.glob("*.png")):
        with Image.open(png) as img:
            print(f"  {png.name}: {img.width}×{img.height}  ({'OK' if img.size == (1200, 630) else 'WRONG SIZE'})")


def describe_layout():
    print("""
── Layout Description ────────────────────────────────────────────────────────
  Canvas:    1200 × 630 px, background #0b0e14 (near-black)
  Accent:    8px wide phosphor-green (#4fe3a1) vertical bar
             x=72, y=72..558 (full height within padding)
  Kicker:    "// avneeshk.me" in IBMPlexMono-Regular 22px, cyan #4cc9f0
             position: (104, 76)
  Title:     IBMPlexMono-SemiBold 28–66px (auto-sized), color #e6ebf2
             word-wrapped to max 1040px wide, max 3 lines
             starts at y≈122, left-aligned at x=104
  Separator: 1px horizontal line #1e2530, below title block + 30px gap
  Footer:    IBMPlexMono-Regular 22px
             Left:  "Avneesh Kasture" (#9aa6b8) at x=104, y≈566
             Right: "secure MCP · agentic security" (#5a6478) right-aligned
  Padding:   72px on all sides; text left edge at x=104 (72+8+24)
             text right edge at x=1128 (1200-72)
──────────────────────────────────────────────────────────────────────────────
""")


def main():
    print("=== OG Image Generator ===\n")
    print("── Fonts ────────────────────────────────────────────────────────────────")
    ensure_fonts()

    print("\n── Generating cards ─────────────────────────────────────────────────────")
    process_posts()
    process_default()

    verify_dimensions()
    describe_layout()

    # Report which font files were actually used
    print("── Fonts used ────────────────────────────────────────────────────────────")
    for key, path in FONT_PATHS.items():
        print(f"  {key}: {path}")


if __name__ == "__main__":
    main()
