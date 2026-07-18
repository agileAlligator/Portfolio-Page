#!/usr/bin/env python3
"""
Design-system guard (PreToolUse hook).

Blocks edits that create ad-hoc components on avneeshk.me:
  1. inline style="…" in any .html file
  2. a new CSS class definition (.foo { … }) whose name is not registered
     in .claude/design-system.json

The escape hatch is intentional friction: register the class in
.claude/design-system.json (and document it in DESIGN-SYSTEM.md) FIRST, then
write the CSS. Editing the manifest or the doc is always allowed.

Exit 2 + stderr => the edit is blocked and the message is shown to Claude.
Exit 0 => allowed. Never blocks on its own errors.
"""
import sys, os, re, json, pathlib


def find_root(fp, cwd):
    candidates = []
    if fp:
        candidates.append(os.path.dirname(os.path.abspath(fp)))
    if cwd:
        candidates.append(cwd)
    candidates.append(os.getcwd())
    for start in candidates:
        p = pathlib.Path(start)
        for anc in [p, *p.parents]:
            if (anc / ".claude" / "design-system.json").exists():
                return str(anc)
    return cwd or os.getcwd()


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        sys.exit(0)

    ti = data.get("tool_input", {}) or {}
    fp = ti.get("file_path") or ti.get("filePath") or ""
    if not fp:
        sys.exit(0)

    chunks = []
    if isinstance(ti.get("content"), str):
        chunks.append(ti["content"])
    if isinstance(ti.get("new_string"), str):
        chunks.append(ti["new_string"])
    for e in ti.get("edits", []) or []:
        if isinstance(e.get("new_string"), str):
            chunks.append(e["new_string"])
    new = "\n".join(chunks)
    if not new.strip():
        sys.exit(0)

    base = os.path.basename(fp)
    # Registering a component (manifest / doc) is how you sanction it.
    if base in ("design-system.json", "DESIGN-SYSTEM.md"):
        sys.exit(0)

    violations = []

    if fp.endswith(".html"):
        if re.search(r'\bstyle\s*=\s*["\']', new):
            violations.append(
                'inline style="…" — ad-hoc styling. Use a component class in '
                'style.css (registered in the manifest) or a sanctioned .u-* utility.')

    if fp.endswith(".css"):
        root = find_root(fp, data.get("cwd", ""))
        try:
            manifest = json.load(open(os.path.join(root, ".claude", "design-system.json")))
            allowed = set(manifest.get("classes", []))
        except Exception:
            allowed = None
        if allowed is not None:
            body = re.sub(r'/\*.*?\*/', '', new, flags=re.DOTALL)  # ignore commented code
            introduced = {m.group(1) for m in re.finditer(
                r'(?m)^\s*\.(-?[A-Za-z_][A-Za-z0-9_-]*)', body)}
            unregistered = sorted(c for c in introduced if c not in allowed)
            if unregistered:
                violations.append(
                    "new component class(es) not in the design system: " +
                    ", ".join("." + u for u in unregistered) +
                    " — add them to .claude/design-system.json (and DESIGN-SYSTEM.md) first.")

    if violations:
        msg = ("⛔ Design-system guard blocked this edit to " + base + ":\n- " +
               "\n- ".join(violations) +
               "\n\nComponents must be normalized and registered so the site stays "
               "consistent. See DESIGN-SYSTEM.md. To sanction a new component, edit "
               ".claude/design-system.json first, then make this edit again.")
        print(msg, file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
