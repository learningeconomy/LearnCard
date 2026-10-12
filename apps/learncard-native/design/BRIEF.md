# Approved native visual direction — 2026-10-12

Concept: [collection-concept-2026-10-12.png](collection-concept-2026-10-12.png). Generated with the built-in image generation tool, then approved by the user. This is design reference, not a runtime screen image or credential asset.

## Generation brief

High-fidelity mobile LearnCard Collection UI, light and dark side by side. Correct tiled L logo from the existing branding asset; small mark at top left, circular Create plus and profile at right. Neutral softened white / charcoal canvas, strong visible Collection title, search, horizontally scrolling category pills. Layered physical cyan featured credential with large round artwork on the left, clear title and issuer, category and small circular arrow. Two-column colorful gallery, circular credential graphics, crisp navy text, distinct pink and blue fills. Native bottom navigation with expressive line icons. Avoid generic gradient page backgrounds, pale green washes, giant branding, marketing copy, and oversized action tiles.

Reference input: `apps/learn-card-app/environments/learncard/assets/branding/brand-mark.png`. Original tool output remains under Codex generated_images; this selected copy is versioned with the experiment. The brief above captures the generation direction; it is not a byte-for-byte transcript of the original tool prompt.

## Implementation and subsequent user steering

- SwiftUI and native TabView, navigation stacks, search input, sheets, and zoom detail transitions.
- Collection, Inbox, **Apps**, **Home**. The concept's Activity tab evolves into a streamlined dashboard; the user requested Apps after approving the concept.
- The staging account's original artwork and issuer display names are retained. Sample art in the concept is fictional and is not substituted into live credentials.
- Featured card gently rocks and has two colored backing layers. Reduce Motion disables decorative movement and zoom; Dynamic Type switches to a single-column gallery.
- Standard neutral page backgrounds allow card color to carry the brand. Explicit headings avoid the observed blank large-title region on iOS 26.4.
- Consumer Apps starts with a staging web-store link and an honest next-phase description. Native catalog/installation/consent is not yet wired.
- Home uses current incoming counts and session-local activity, not fabricated progress statistics.
