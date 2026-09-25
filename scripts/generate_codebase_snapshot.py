#!/usr/bin/env python3
"""Generate CODEBASE.md from the current project working tree.

Includes tracked and non-ignored untracked source/config/documentation files.
Never includes ignored secrets such as .env or local virtual environments.
Binary files are inventoried with size and SHA-256 rather than embedded.
"""

from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "CODEBASE.md"
EXCLUDED_DIRS = {".git", "node_modules", "dist", "build", "__pycache__", ".pytest_cache"}


def project_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    files: list[Path] = []
    for raw in result.stdout.split(b"\0"):
        if not raw:
            continue
        rel = raw.decode("utf-8", errors="surrogateescape")
        path = ROOT / rel
        if not path.is_file() or OUTPUT.resolve() == path.resolve():
            continue
        if any(part in EXCLUDED_DIRS for part in path.relative_to(ROOT).parts):
            continue
        files.append(path)
    return sorted(files, key=lambda p: p.relative_to(ROOT).as_posix().lower())


def fence_for(text: str) -> str:
    longest = 0
    current = 0
    for char in text:
        if char == "`":
            current += 1
            longest = max(longest, current)
        else:
            current = 0
    return "`" * max(4, longest + 1)


def main() -> None:
    files = project_files()
    text_files: list[tuple[Path, str]] = []
    binary_files: list[tuple[Path, int, str]] = []

    for path in files:
        data = path.read_bytes()
        if b"\0" not in data:
            try:
                text_files.append((path, data.decode("utf-8")))
                continue
            except UnicodeDecodeError:
                pass
        binary_files.append((path, len(data), hashlib.sha256(data).hexdigest()))

    lines = [
        "# VoiceShieldAI Complete Codebase Snapshot",
        "",
        "> Generated from the current working tree by `scripts/generate_codebase_snapshot.py`.",
        "> This file embeds all tracked and non-ignored untracked UTF-8 source/config/documentation files.",
        "> Ignored local secrets (`.env`), Git metadata, dependencies, builds, caches, and binary payloads are excluded.",
        "> Binary project files are listed in the inventory at the end with size and SHA-256.",
        "",
        "## Snapshot Summary",
        "",
        f"- Text files embedded: **{len(text_files)}**",
        f"- Binary files inventoried: **{len(binary_files)}**",
        f"- Total project files represented: **{len(files)}**",
        "",
        "## Embedded Text Files",
        "",
    ]

    for index, (path, content) in enumerate(text_files, start=1):
        rel = path.relative_to(ROOT).as_posix()
        fence = fence_for(content)
        lines.extend([f"### {index}. `{rel}`", "", f"```{fence}", content.rstrip("\n"), f"{fence}", ""])

    lines.extend(["## Binary File Inventory", ""])
    if binary_files:
        lines.extend(["| File | Bytes | SHA-256 |", "|---|---:|---|"])
        for path, size, digest in binary_files:
            rel = path.relative_to(ROOT).as_posix()
            lines.append(f"| `{rel}` | {size} | `{digest}` |")
    else:
        lines.append("No binary project files were found.")
    lines.append("")

    OUTPUT.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes; {len(text_files)} text, {len(binary_files)} binary)")


if __name__ == "__main__":
    main()
