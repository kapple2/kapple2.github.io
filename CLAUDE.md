# Project rules (kapple2.github.io)

## Emulator: source is B, output is A

- **A** (this repo, served by GitHub Pages): `emulator\` — built output, do not hand-edit its bundles.
- **B** (source): `D:\dev\proj-apple2\proj-apple2-korean-basic\src\emulator.js\` — edit here, then run `build.bat` in that folder.
- After building B, copy the contents of B's `dist\` into A's `emulator\`. Then `diff -rq` the two folders; the only expected differences are `main2.bundle.js` and `main2e.bundle.js` (minifier naming). Anything else is drift to investigate.
- A-only sources live in B: `companion.js`, `mirror.js`, `json/disks/kapple_index.js`. Edit them in B.
- Site-level changes (nav, `styles.css`, company page, clown and its music, `index.html`) go in this repo, not in B. Keep the nav links identical in B's `index.html` and A's `emulator\index.html`.
- Keep `KAPPLE.md` in B unchanged unless asked: build.bat copies it to A as `README.txt`.
- Full notes: memory `kapple2-emulator-build-ab`.

## Git

- Default branch `main`. Ask before creating a feature branch.
- Commit and push only when asked. If the tree holds changes from another session, ask which to include before committing.
- No Claude attribution lines in commits or PR descriptions.
