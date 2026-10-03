# LC-2222 protected PDF size probe

Measured locally on 2026-10-03 with headless Chromium, html2canvas 1.4.1 and jsPDF 4.2.1. Run from the repository root:

```sh
node planning/lc-2222/probe-pdf-sizes.cjs
```

The probe uses invented résumé content with realistic heading/contact/summary/experience/education/skills/certification density, local Arial, grayscale styling and no photos or remote assets. Every intended page has distinct rendered content so jsPDF image deduplication does not artificially hide the size of additional pages. It follows the current export width of 760 CSS pixels, scale 2, US Letter, section break anchors and lossless PNG slicing. The current break algorithm turns 2/3 intended content pages into 3/4 PDF pages; this is a measurement of existing behavior, not a page-count promise.

| Content pages | Actual PDF pages | Existing PNG FAST, bytes | PNG SLOW + PDF compression, bytes | SLOW size, KiB | Fits proposed 256 KiB cap |
| ------------- | ---------------- | ------------------------ | --------------------------------- | -------------- | ------------------------- |
| 1             | 1                | 286,991                  | 285,802                           | 279.10         | No                        |
| 2             | 3                | 571,739                  | 569,669                           | 556.32         | No                        |
| 3             | 4                | 856,067                  | 852,907                           | 832.92         | No                        |

SLOW is lossless: it changes image encoding effort and PDF stream compression, not resolution or visual fidelity. It reduces this one-page sample by less than 1%. The SLOW PDFs alone require 381,072 / 759,560 / 1,137,212 base64 characters, before signed credential, presentation, encryption and selected credential overhead. The existing 512 KiB ciphertext cap therefore cannot accommodate representative two- and three-page PDFs inline; the proposed 256 KiB PDF cap also rejects this ordinary one-page sample.

This is a synthetic capacity check, not production/device QA or a guarantee of typical user file sizes. Different fonts, photos, raster complexity and selected credentials may increase size further. No actual user data was collected, rendered or uploaded. The probe never changes generated PDFs or service limits. Inline-only publication needs a design change before it can be a practical release default; an oversize error alone is insufficient evidence that the normal résumé flow works.

## JPEG comparison

The same raster dimensions and page slicing were measured with JPEG encoding as a possible capacity alternative:

| Content pages | JPEG quality 0.95, bytes | JPEG quality 0.92, bytes |
| ------------- | ------------------------ | ------------------------ |
| 1             | 425,918                  | 359,304                  |
| 2             | 833,800                  | 703,939                  |
| 3             | 1,239,031                | 1,046,151                |

JPEG is larger than PNG for these text-dense samples. Even the single-page JPEG at quality 0.92 exceeds 320 KiB. At a 760-pixel display width, a visual comparison of the original PNG and both JPEG samples found readable headings/contact/body text and preserved line separators; this is a subjective local legibility check, not a fidelity guarantee. JPEG remains lossy and does not solve the measured capacity problem, so no export encoding or quality was changed.

To regenerate the comparison rasters without committing generated media:

```sh
node planning/lc-2222/probe-pdf-sizes.cjs --samples
```

This writes `/tmp/lc-2222-png-FAST.png`, `/tmp/lc-2222-png-SLOW.png`, `/tmp/lc-2222-jpeg-0.95.jpg` and `/tmp/lc-2222-jpeg-0.92.jpg`. The image samples use entirely synthetic data.

## Implemented capacity decision

The implementation preserves the existing PDF export bytes and stores them in separately encrypted managed attachments. The maximum PDF size is 4 MiB, divided into up to 16 chunks of 256 KiB before encryption. The existing main credential envelope and service request limits remain unchanged. A signed credential binds the attachment identity, content version, byte length and hash; publication commits only after every encrypted chunk exists under the exact owner/share/version binding. These measured PNG samples need 2, 3 and 4 chunks respectively, so all fit without reducing resolution or changing export quality.
