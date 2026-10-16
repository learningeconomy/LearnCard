# Small drawn heading accents

October 16, 2026. The user likes the little colored ray strokes beside the create/send credential headings and asked to bring that flair into the main panes. This extends the existing editable illustration vocabulary; it does not need another generated composition.

`headingFlair` reuses the builder's three rounded ray strokes as template artwork. Root `PageHeading` opts into a 32-point accent beside its text: yellow Home, blue Passport, pink Inbox and teal Apps. One selected supporting section per pane uses a smaller 20-point mark: Make it yours on Home, Latest issued in Passport, Updates in Inbox and Installed apps in Apps. Empty or absent sections do not introduce decoration of their own.

The mark stays beside the words with six points of spacing. It mirrors in right-to-left layouts, is hidden from accessibility and hit testing, and is omitted at accessibility text sizes. Text keeps its original heading identity, size and wrapping. Other account/claim/setup titles retain their current compositions. The scrolled brand, bottom tray, tab targets and active underline keep their established behavior; the rays are static and never indicate status.

See [the reusable rules](DESIGN_SYSTEM.md#heading-accents).

## Actual native captures

These are simulator screenshots of production SwiftUI with synthetic demo records, not generated concepts or real account data.

| Pane     | Standard English light                                                                 | Additional layout review                                                                                |
| -------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Home     | [Yellow title mark](heading-accents-home-light.png)                                    | French dark and Arabic accessibility are in the test attachments                                        |
| Passport | [Blue title and smaller yellow Latest issued mark](heading-accents-passport-light.png) | [Arabic dark, standard text](heading-accents-passport-arabic-dark.png)                                  |
| Inbox    | [Pink title mark](heading-accents-inbox-light.png)                                     | Arabic standard/accessibility are in the test attachments                                               |
| Apps     | [Teal title and smaller pink Installed apps mark](heading-accents-apps-light.png)      | [Arabic accessibility stress layout, decoration omitted](heading-accents-apps-arabic-accessibility.png) |

## Verification

`artifacts/heading-accents-ui-2026-10-16.xcresult` passes all three focused existing UI cases. The root-title case now visits all four panes in English light, Arabic dark and Arabic accessibility layouts, checks visible headings within the screen bounds, and captures each. The shared-brand case verifies compact-header position and the current Passport name; its old Collection label expectation was stale. The existing French dark/Arabic large Home routing case also passes. Attachments were exported and visually reviewed.

This is focused layout/navigation coverage, not a full-suite or hosted run. No account, credential or service contract changes are part of this pass. See [current installation and validation](../TESTING.md#drawn-heading-accents--october-16-2026).
