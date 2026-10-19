# ScoutPass Tailwind 4 smoke captures

Captured on October 19, 2026 from the actual production-built ScoutPass app, signed into the user-authorized test account. These are manual smoke evidence, not frozen visual baselines or a new CI gate.

| Screen       | Desktop web                                 | Native iOS                                  |
| ------------ | ------------------------------------------- | ------------------------------------------- |
| Campfire     | ![Web Campfire](web-campfire-tailwind4.png) | ![iOS Campfire](ios-campfire-tailwind4.png) |
| Wallet       | ![Web Wallet](web-wallet-tailwind4.png)     | ![iOS Wallet](ios-wallet-tailwind4.png)     |
| Merit badges | ![Web badges](web-badges-tailwind4.png)     | ![iOS badges](ios-badges-tailwind4.png)     |
| Troops       | ![Web Troops](web-troops-tailwind4.png)     | ![iOS Troops](ios-troops-tailwind4.png)     |

The desktop captures use Chrome at 1656×839. The native captures use an actual bundled Capacitor app on an iPhone 17 Pro simulator running iOS 26.4, with no development server URL. Automatic bundle updates were disabled only in the local installed build; tracked native configuration and lockfiles were restored unchanged.

Campfire had both `justify-start` and `justify-center`. Tailwind 3 resolved this to center; Tailwind 4 resolved it to start. Removing the conflicting start class restores centered news cards, confirmed with computed `justify-content: center` and a zero-pixel center offset. The existing Scout news suite passes all five cases. The production web build and native simulator build pass.

The local static web preview displays the bundled 2023 fallback articles because it does not serve `/api/scout-news`. Native uses the live 2026 feed. This content difference is expected; these are not before/after comparisons. Both signed-in clients load 14 merit badges and 11 troop memberships. Header controls, navigation, card gutters and overview layouts were inspected manually. Physical devices, Android and minimum supported browser versions still need separate release QA.

See [capture.json](capture.json) for dimensions, timestamps, hashes and build provenance. No sign-in codes or account storage are included.
