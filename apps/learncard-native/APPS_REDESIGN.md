# Rendered learner Apps

October 16, 2026. The user approved trying the [new rendered boards](design/APPS_RENDERED_BRIEF.md). This pass changes the existing native Apps presentation while retaining its consumer services, account isolation, browser and agreement contracts.

## My apps and discovery

My apps now starts with actual installed entries, or an illustrated Discover invitation after a successful empty read. Families, native Data Sharing and the web-only résumé builder follow below. Utilities remain available when app search has no matches or an app read fails. Installed counts appear only after the installed-page walk has completed.

The empty invitation, typed search with no matches, loading and failure are distinct. Whitespace-only search is treated as no query. Clear search dismisses the keyboard and restores entries; category/search reset never installs an app. Discovery retains the existing category values, paging/search across pages, real promotion flags and app-detail review before adding.

Installed cards have separate detail and direct Open actions. Both remain readable and reachable with long titles and accessibility type. Discover uses one larger actual featured entry when the catalog supplies that flag; other entries keep catalog order. The secondary Discover row does not fabricate personalized recommendations.

## Material and artwork

`ConsumerAppSurfaces.swift` owns static raised frames, shallow lower edges, directional light and corner contours. Reading surfaces use adaptive ink/backgrounds. The empty invitation uses an opaque Colorful teal surface with navy text. No card tilt loop is added to Apps.

`prepare-illustrations.ts` generates the original rocket/app-window empty illustration and the rendered generic app placeholder as editable SVG. Gradient lighting, highlights and geometric lower edges give the artwork depth without a screenshot crop or generated publisher identity. Existing publisher icons/screenshots stay intact; icon display now fits their aspect ratio instead of filling/cropping. Only their surrounding native frame has a border/edge/shadow.

## Detail and agreement

Listing detail carries a raised identity panel, actual category, Add/Open state, supplied description/screenshots and existing permission summary/links. No catalog art means a generic app-window fallback rather than the board's invented globe/palette. No new catalog facts, rankings, reviews or trust badges are added.

Access review uses a compact app identity, readable groups, actual recipients and explicit selected-credential information. A duplicate contract title is omitted when it exactly equals the app name. Required scopes are fixed labeled rows with a selected mark; optional scopes retain independent toggles that start off. The underlying `ConsumerConsentDecision` and its validation are unchanged. Viewing or cancelling the sheet grants no access and installs nothing. The final agreement action retains contextual loading, blocked-state validation and stale-contract refresh.

Presented access sheets explicitly inherit selected language and direction. DEBUG text-size review settings apply inside the sheet as well as the root, so enlarged captures are actual accessibility previews, never mislabeled default Arabic layouts.

Container accessibility groups preserve independent child control identities. A parent identifier on an ungrouped SwiftUI card otherwise overrides its child button identifier; the empty/search/error cards explicitly contain their children rather than merging their actions.

## Verification and boundaries

See [recorded checks and installation evidence](TESTING.md#rendered-apps--october-16-2026) and [native captures](design/APPS_RENDERED_BRIEF.md#implemented-native-screens). Synthetic UI fixtures cover empty and unavailable app lists without contacting a real account. Existing install/consent/withdrawal, partner identity, browser background disposal, Home routing and language persistence checks remain relevant.

Third-party app content still opens in the separate browser. Uninstalling an app and withdrawing a data connection remain different actions. No account/provider/rollout setting changes are part of this pass. Live installation, consent publication/withdrawal, real partner compatibility and physical-device review remain their existing manual gates. Native hosted CI stays manual.

The [Pathways/Journeys learner queue](LEARNER_LEARNING_PLAN.md) remains separate. No disabled learning tiles, institutional tools or framework/Journey authoring are introduced here.
