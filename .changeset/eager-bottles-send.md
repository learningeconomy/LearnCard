---
"learn-card-app": patch
"learn-card-base": patch
"@learncard/react": patch
"@learncard/credential-library": patch
"@learncard/credential-viewer": patch
---

feat: [LC-2111] Add Qualifications across LearnCard navigation, credential organization, issuance, sharing, and resumes. Reclassify eligible automatic categories while preserving explicit choices, default qualifications to certificate displays, and keep expired credentials visible and shareable. Add illustrated test credentials and viewer support for preserving their expiration dates.

Fix Boost notification render loops by reusing URI-keyed cached Boost details.

Preserve indexed categories in sharing and classify preselected credentials once, reusing cached Boost lookups when index metadata is unavailable.

Give Qualifications a distinct navigation identity so it does not reuse another menu item's React key.

Retry truncated category scans on the next session and refresh open sharing lists after reclassification.

Keep available credentials selectable when another indexed credential cannot be loaded.

Replace Qualifications trophy placeholders with the supplied Figma SVG artwork across wallet tiles, navigation, selectors, activity filters, credential corners, and image fallbacks. Keep Colorful and Formal variants independent and preserve the existing Formal empty-state fallback.

Use an orange Qualifications palette across Passport tiles, category pages, Boost previews, notifications, and certificate displays. Match the existing section shades with orange-300 tiles and tabs, orange-400 headers, orange-200 page backgrounds, and orange-500 count badges with dark text. Keep Neutral Mode surfaces neutral while using the supplied Colorful Solid Color Qualifications icon in both Passport layouts.

Fix About Qualifications to display Qualifications artwork and explain professional credentials instead of falling back to Skills. Select descriptor content by category rather than the translated title, add the description in every supported language, and present the modal through the shared inset-owning surface.
