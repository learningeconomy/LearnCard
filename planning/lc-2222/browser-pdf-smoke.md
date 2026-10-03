# Managed resume PDF browser smoke

Local synthetic browser check on 2026-10-03; no production account or document data.

An actual 3,315-byte jsPDF containing a heading and one sentence was served by a localhost test page. The exact same PDF blob URL was mounted in two iframes. Playwright used the full Chromium channel in headless mode, so the test included its built-in PDF viewer.

- `sandbox=""`: Chromium navigated to `chrome-error://chromewebdata/` and showed a gray blocked-document icon.
- Unsandboxed control: Chromium loaded its built-in PDF extension and visibly rendered both text lines correctly.
- The screenshot was visually inspected at `/tmp/lc-2222-pdf-smoke.png`; the disposable script and evidence are `/tmp/lc-2222-pdf-smoke.cjs` and `/tmp/lc-2222-pdf-smoke-evidence.txt`.
- The default headless shell rendered both frames blank. It was insufficient to test native PDF behavior; the full Chromium channel supplied the decisive comparison.

The recipient UI therefore shows a managed PDF card with title, proof, size and an explicit download action. It does not mount a broken native preview, relax its sandbox, eagerly retrieve PDF chunks, or add a PDF rendering dependency. The recipient opens the PDF on their device after a guarded download. This smoke verifies the browser limitation; it does not claim deployed service or native mobile QA.

Focused UI coverage checks that opening a managed resume fetches no PDF bytes; a deliberate download uses the exact managed attachment reader and fresh active/version/expiry checks. A stopped, expired or replaced link cannot complete a cached export. The passcode flow uses four password checks for initial opening plus one complete 16-chunk download: two for initial metadata/content, one for the first attachment chunk, one for final active/version authorization. The short-lived grant authenticates the remaining chunks without repeating the passcode challenge.
