# LC-2006 screenshot review

The twelve `*-tailwind4.png` files are the actual screenshots attached to the
passing Playwright run on October 16, 2026. `captures.json` records capture times
and SHA-256 hashes for both sides. The original Tailwind 3 screenshots remain in
`../baselines`, captured in commit `1955fd40e` before upgrading.

Open `index.html` to compare all four states across desktop/mobile Chromium and
mobile WebKit. Both panes scroll together; choose **Actual size** to inspect
pixels at their original size. The page also works from a local static server
rooted at `tests/visual` (open `/review/`).

These are review evidence for this migration. New runs attach screenshots to the
Playwright report; do not refresh this evidence or the reference images simply
to make a failing comparison pass.
