# LC-2006 screenshot review

The original thirty `*-tailwind4.png` files are the actual screenshots attached to
the passing Playwright run on October 16, 2026. Three additional `my-apps` captures
were added on October 18 for the current `/launchpad` page, using the same original
Tailwind 3 application commit for the before references. `captures.json` records
capture times and SHA-256 hashes for both sides. The first twelve Tailwind 3 screenshots were
captured in commit `1955fd40e`. The eighteen added page references were captured
from a temporary checkout of that commit, with the original Tailwind 3.4.19
application source/styles and the same added fixtures and bundled fonts.
All before images remain in `../baselines`; the original twelve are unchanged.

Open `index.html` to compare ten displayed states across desktop/mobile Chromium
and mobile WebKit. The current My Apps landing is included; the obsolete Apps
browse catalogue is omitted from the gallery, with its original evidence retained.
Both panes scroll together; choose **Actual size** to inspect pixels at their
original size. The page also works from a local static server
rooted at `tests/visual` (open `/review/`).

These are review evidence for this migration. New runs attach screenshots to the
Playwright report; do not refresh this evidence or the reference images simply
to make a failing comparison pass.
