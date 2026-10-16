# LC-2006 screenshot review

The thirty `*-tailwind4.png` files are the actual screenshots attached to the
passing Playwright run on October 16, 2026. `captures.json` records capture times
and SHA-256 hashes for both sides. The first twelve Tailwind 3 screenshots were
captured in commit `1955fd40e`. The eighteen added page references were captured
from a temporary checkout of that commit, with the original Tailwind 3.4.19
application source/styles and the same added fixtures and bundled fonts.
All before images remain in `../baselines`; the original twelve are unchanged.

Open `index.html` to compare all ten states across desktop/mobile Chromium and
mobile WebKit. Both panes scroll together; choose **Actual size** to inspect
pixels at their original size. The page also works from a local static server
rooted at `tests/visual` (open `/review/`).

These are review evidence for this migration. New runs attach screenshots to the
Playwright report; do not refresh this evidence or the reference images simply
to make a failing comparison pass.
