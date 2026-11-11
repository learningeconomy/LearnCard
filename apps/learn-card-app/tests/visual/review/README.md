# LC-2006 screenshot review

The `*-tailwind4.png` files are screenshots attached to the passing Playwright
run after restoring Ionic header/grid padding. The current `/launchpad` has both
page-content captures and full signed-in captures with the real sidebar, mobile
navigation, header and profile/alerts controls. The signed-in fixture uses fixed
local identity/query data; its WebKit phone capture selects Ionic iOS mode.
All before references use the same original Tailwind 3 application commit. `captures.json` records
capture times and SHA-256 hashes for both sides. The first twelve Tailwind 3 screenshots were
captured in commit `1955fd40e`. The eighteen added page references were captured
from a temporary checkout of that commit, with the original Tailwind 3.4.19
application source/styles and the same added fixtures and bundled fonts.
All before images remain in `../baselines`; the original twelve are unchanged.

Open `index.html` to compare eleven displayed states across desktop/mobile Chromium
and mobile WebKit. The current My Apps landing is included; the obsolete Apps
browse catalogue is omitted from the gallery, with its original evidence retained.
Both panes scroll together; choose **Actual size** to inspect pixels at their
original size. The page also works from a local static server
rooted at `tests/visual` (open `/review/`).

These are review evidence for this migration. New runs attach screenshots to the
Playwright report; do not refresh this evidence or the reference images simply
to make a failing comparison pass.

The native recording and screenshots in `native/` use the actual bundled Capacitor
app on an iOS simulator with the existing public demo account. They are separate
from the fixed browser fixtures. See `native/README.md` for the build and scope.
