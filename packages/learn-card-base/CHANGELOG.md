# learn-card-base

## 0.1.32

### Patch Changes

-   [#1207](https://github.com/learningeconomy/LearnCard/pull/1207) [`3312e78f640f536660c91c643fc57cf02196b4dc`](https://github.com/learningeconomy/LearnCard/commit/3312e78f640f536660c91c643fc57cf02196b4dc) Thanks [@rhen92](https://github.com/rhen92)! - chore: [LC-1788] Bug fest

## 0.1.31

### Patch Changes

-   [#1150](https://github.com/learningeconomy/LearnCard/pull/1150) [`66979075bf3a39fe76435f31bdc582f7f25009c0`](https://github.com/learningeconomy/LearnCard/commit/66979075bf3a39fe76435f31bdc582f7f25009c0) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps): bump the npm_and_yarn group across 3 directories with 6 updates

-   [#1203](https://github.com/learningeconomy/LearnCard/pull/1203) [`a5382de5e8dec3d3c3128e00c93be3b162babe45`](https://github.com/learningeconomy/LearnCard/commit/a5382de5e8dec3d3c3128e00c93be3b162babe45) Thanks [@gerardopar](https://github.com/gerardopar)! - chore: [LC-1803] - Add IOS(26) native support

-   [#1204](https://github.com/learningeconomy/LearnCard/pull/1204) [`e786bdeb80717d79ab19462744ee76da4204e9c4`](https://github.com/learningeconomy/LearnCard/commit/e786bdeb80717d79ab19462744ee76da4204e9c4) Thanks [@goblincore](https://github.com/goblincore)! - LC-1790: Eliminate first-load route flash on wallet sub-routes

-   Updated dependencies [[`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02), [`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02)]:
    -   @learncard/types@5.14.0
    -   @learncard/helpers@1.2.17
    -   @learncard/lca-api-plugin@1.2.7
    -   @learncard/ler-rs-plugin@0.1.8
    -   @learncard/sss-key-manager@0.1.7

## 0.1.30

### Patch Changes

-   [#1177](https://github.com/learningeconomy/LearnCard/pull/1177) [`95e6dd7f450fb97a8295465755c7cf3d6f208522`](https://github.com/learningeconomy/LearnCard/commit/95e6dd7f450fb97a8295465755c7cf3d6f208522) Thanks [@goblincore](https://github.com/goblincore)! - chore: LC-1785 - AI Topics & Sessions UI Refresh (Desktop)

-   [#1192](https://github.com/learningeconomy/LearnCard/pull/1192) [`1a3834a8004118351fddbd25bb535de4ed9be569`](https://github.com/learningeconomy/LearnCard/commit/1a3834a8004118351fddbd25bb535de4ed9be569) Thanks [@Custard7](https://github.com/Custard7)! - feat: Capgo Fixes + CI Check + Version Modal

-   [#1197](https://github.com/learningeconomy/LearnCard/pull/1197) [`11a2c3a0c0cffd0c594cc08b4c5f2bee1085ed4e`](https://github.com/learningeconomy/LearnCard/commit/11a2c3a0c0cffd0c594cc08b4c5f2bee1085ed4e) Thanks [@gerardopar](https://github.com/gerardopar)! - add context check >=1.0.3+

## 0.1.29

### Patch Changes

-   [#1161](https://github.com/learningeconomy/LearnCard/pull/1161) [`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `sendAiSessionCredential` to Partner Connect SDK for recording AI tutoring sessions.

    This enables App Store embedded apps to send AI Session credentials that are automatically organized under AI Topics. The feature includes:

    -   **Partner Connect SDK**: New `sendAiSessionCredential()` method with structured summary data support
    -   **Backend Support**: App event handler for `send-ai-session-credential` with listing-owned boost creation
    -   **AI Topic Hierarchy**: Sessions are automatically organized under a parent AI Topic per app
    -   **Client-Side Storage**: Credentials are immediately stored in the user's LearnCloud wallet
    -   **Example App**: Updated with working AI Session creation flow

    Apps can now record structured learning sessions with key takeaways, skills demonstrated, learning outcomes, and recommended next steps that appear in the user's AI Topics page.

-   [#1174](https://github.com/learningeconomy/LearnCard/pull/1174) [`7417b530b76a9e6a2f5f6ce8c26dd45c723a58db`](https://github.com/learningeconomy/LearnCard/commit/7417b530b76a9e6a2f5f6ce8c26dd45c723a58db) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: [LC-1778] - Add Youtube API support

-   [#1182](https://github.com/learningeconomy/LearnCard/pull/1182) [`45a18ec836103649a95b0dc7886a91dcac276468`](https://github.com/learningeconomy/LearnCard/commit/45a18ec836103649a95b0dc7886a91dcac276468) Thanks [@rhen92](https://github.com/rhen92)! - chore: [LC-1762] Plus Button Updates

-   [#1178](https://github.com/learningeconomy/LearnCard/pull/1178) [`12fb1bc0419c5aac63d43895d5b68380a8cc26d8`](https://github.com/learningeconomy/LearnCard/commit/12fb1bc0419c5aac63d43895d5b68380a8cc26d8) Thanks [@gerardopar](https://github.com/gerardopar)! - chore: [LC-1747] - Mobile AI Sessions UI Redesign

-   [#1180](https://github.com/learningeconomy/LearnCard/pull/1180) [`7e85a856b7694ebb43ed79bc4a3b96b3fce43cc3`](https://github.com/learningeconomy/LearnCard/commit/7e85a856b7694ebb43ed79bc4a3b96b3fce43cc3) Thanks [@smurflo2](https://github.com/smurflo2)! - Add widgets and My Skill Profile to AI Insights

-   Updated dependencies [[`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f), [`98edecaa4348a95b67753b084da91ee38a3813d2`](https://github.com/learningeconomy/LearnCard/commit/98edecaa4348a95b67753b084da91ee38a3813d2), [`8e408e48f89db234bcb7d357787a0faf3a605488`](https://github.com/learningeconomy/LearnCard/commit/8e408e48f89db234bcb7d357787a0faf3a605488)]:
    -   @learncard/types@5.13.6
    -   @learncard/sss-key-manager@0.1.6
    -   @learncard/helpers@1.2.16
    -   @learncard/lca-api-plugin@1.2.6
    -   @learncard/ler-rs-plugin@0.1.7

## 0.1.28

### Patch Changes

-   [#1164](https://github.com/learningeconomy/LearnCard/pull/1164) [`b3d1e4234c8d2bf6251f33d350850086e98d59b0`](https://github.com/learningeconomy/LearnCard/commit/b3d1e4234c8d2bf6251f33d350850086e98d59b0) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: LC-1678 - Pathways 2.0: Explore Roles

-   [#1169](https://github.com/learningeconomy/LearnCard/pull/1169) [`46ab1ec6c928ba4b5a9d1e522ad1b42a9a9bc7ac`](https://github.com/learningeconomy/LearnCard/commit/46ab1ec6c928ba4b5a9d1e522ad1b42a9a9bc7ac) Thanks [@rhen92](https://github.com/rhen92)! - chore: [LC-1285] Skip published step for Boost

-   [#1168](https://github.com/learningeconomy/LearnCard/pull/1168) [`ac87f698a64b5f40d23d115a8b55da3039c07cb0`](https://github.com/learningeconomy/LearnCard/commit/ac87f698a64b5f40d23d115a8b55da3039c07cb0) Thanks [@smurflo2](https://github.com/smurflo2)! - Grow Skills redesign and modal

-   [#1151](https://github.com/learningeconomy/LearnCard/pull/1151) [`4250d4814b6f38fc9ed9982a94bcfb830ea36edc`](https://github.com/learningeconomy/LearnCard/commit/4250d4814b6f38fc9ed9982a94bcfb830ea36edc) Thanks [@goblincore](https://github.com/goblincore)! - [Feat] [LC-1729][LC-1730][LC-1731] Guardian-Gated Credential Issuance

-   [#1171](https://github.com/learningeconomy/LearnCard/pull/1171) [`7b517d7323fbc91e625cf93d79c579d3c5d3a08a`](https://github.com/learningeconomy/LearnCard/commit/7b517d7323fbc91e625cf93d79c579d3c5d3a08a) Thanks [@smurflo2](https://github.com/smurflo2)! - Allow over 18 children to access AI features with guardian approval

-   [#1155](https://github.com/learningeconomy/LearnCard/pull/1155) [`bc4e363d499f4426ebb957ac34eb6ef13a0ac654`](https://github.com/learningeconomy/LearnCard/commit/bc4e363d499f4426ebb957ac34eb6ef13a0ac654) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: [LC-1675] - What would you like to do card?

-   [#1149](https://github.com/learningeconomy/LearnCard/pull/1149) [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `requestLearnerContext` support across Partner Connect, the LearnCard host, and the network stack so embedded App Store apps can request learner context for AI flows.

    This also allows `requestConsent()` to resolve the configured contract from the app listing's integration when a contract URI is not passed explicitly, and adds a request-learner-context demo app to exercise the full flow.

-   Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`4250d4814b6f38fc9ed9982a94bcfb830ea36edc`](https://github.com/learningeconomy/LearnCard/commit/4250d4814b6f38fc9ed9982a94bcfb830ea36edc), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    -   @learncard/types@5.13.5
    -   @learncard/lca-api-plugin@1.2.5
    -   @learncard/helpers@1.2.15
    -   @learncard/ler-rs-plugin@0.1.6
    -   @learncard/sss-key-manager@0.1.5

## 0.1.27

### Patch Changes

-   [#1157](https://github.com/learningeconomy/LearnCard/pull/1157) [`3f61574ac55e6034042f991ec19701bc2cb84edf`](https://github.com/learningeconomy/LearnCard/commit/3f61574ac55e6034042f991ec19701bc2cb84edf) Thanks [@Custard7](https://github.com/Custard7)! - fix: "Already Connected" Error on Android Resume

## 0.1.26

### Patch Changes

-   [#1154](https://github.com/learningeconomy/LearnCard/pull/1154) [`c66315c41224b0eb92f5a6a030dda732d7827b25`](https://github.com/learningeconomy/LearnCard/commit/c66315c41224b0eb92f5a6a030dda732d7827b25) Thanks [@smurflo2](https://github.com/smurflo2)! - Add Explore Pathways modal with Skill + Goal editing

-   [#1148](https://github.com/learningeconomy/LearnCard/pull/1148) [`5e55b5b46b73a0b77585c71c3edba7f25c0edb9a`](https://github.com/learningeconomy/LearnCard/commit/5e55b5b46b73a0b77585c71c3edba7f25c0edb9a) Thanks [@Custard7](https://github.com/Custard7)! - fix: [LC-1738] Stale Auth Error on Android Resume

-   [#1146](https://github.com/learningeconomy/LearnCard/pull/1146) [`741e391412998677162a858eb96cec931c21de1c`](https://github.com/learningeconomy/LearnCard/commit/741e391412998677162a858eb96cec931c21de1c) Thanks [@rhen92](https://github.com/rhen92)! - chore: [LC-1695] Mobile header and footer polishes

-   Updated dependencies [[`c68bed993c5304a667dc75d422a118858848737a`](https://github.com/learningeconomy/LearnCard/commit/c68bed993c5304a667dc75d422a118858848737a)]:
    -   @learncard/types@5.13.4
    -   @learncard/helpers@1.2.14
    -   @learncard/lca-api-plugin@1.2.4
    -   @learncard/ler-rs-plugin@0.1.5
    -   @learncard/sss-key-manager@0.1.4

## 0.1.25

### Patch Changes

-   [#1134](https://github.com/learningeconomy/LearnCard/pull/1134) [`4baedfa4755593e43d64d0e773367d830dd8a161`](https://github.com/learningeconomy/LearnCard/commit/4baedfa4755593e43d64d0e773367d830dd8a161) Thanks [@smurflo2](https://github.com/smurflo2)! - Self-Assigned Skills UI updates

-   [#1143](https://github.com/learningeconomy/LearnCard/pull/1143) [`a290fd16ef3c2ec81281a0bc3b7ffebbccb9f6b5`](https://github.com/learningeconomy/LearnCard/commit/a290fd16ef3c2ec81281a0bc3b7ffebbccb9f6b5) Thanks [@rhen92](https://github.com/rhen92)! - fix: [LC-1652] Endorsement link doesn't deep link correctly into native apps

-   [#1145](https://github.com/learningeconomy/LearnCard/pull/1145) [`85f43a3a299b3429599bb9c13c4f95c975bd8baf`](https://github.com/learningeconomy/LearnCard/commit/85f43a3a299b3429599bb9c13c4f95c975bd8baf) Thanks [@Custard7](https://github.com/Custard7)! - fix: Stale chunk error crashing the app (Sentry LEARN-CARD-APP-26)

-   [#1135](https://github.com/learningeconomy/LearnCard/pull/1135) [`fb6627b7fa3c4a07c83d4186619a937e6a83f369`](https://github.com/learningeconomy/LearnCard/commit/fb6627b7fa3c4a07c83d4186619a937e6a83f369) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: [LC-1602] - Gate Sensitive Profile Fields (Country, DOB, NotificationsWebhook, Email)

-   Updated dependencies [[`fb6627b7fa3c4a07c83d4186619a937e6a83f369`](https://github.com/learningeconomy/LearnCard/commit/fb6627b7fa3c4a07c83d4186619a937e6a83f369)]:
    -   @learncard/types@5.13.3
    -   @learncard/lca-api-plugin@1.2.3
    -   @learncard/helpers@1.2.13
    -   @learncard/ler-rs-plugin@0.1.4
    -   @learncard/sss-key-manager@0.1.3

## 0.1.24

### Patch Changes

-   [#1099](https://github.com/learningeconomy/LearnCard/pull/1099) [`57b933ebcbbde962daf27b36bfa028e97a7bbdd6`](https://github.com/learningeconomy/LearnCard/commit/57b933ebcbbde962daf27b36bfa028e97a7bbdd6) Thanks [@goblincore](https://github.com/goblincore)! - feat: [LC-1656] User Validation/Review Layer for Resume/Transcript Upload in Build My Learn Card

-   [#1120](https://github.com/learningeconomy/LearnCard/pull/1120) [`00976e097128d18c25c8016a75be9580cd3a7050`](https://github.com/learningeconomy/LearnCard/commit/00976e097128d18c25c8016a75be9580cd3a7050) Thanks [@smurflo2](https://github.com/smurflo2)! - OpenSALT import enhancements - proper classification of tier/competency, icons, pagination, and more!

-   [#1126](https://github.com/learningeconomy/LearnCard/pull/1126) [`bba1f735e107d9cc86880e9f869413bc7072bff8`](https://github.com/learningeconomy/LearnCard/commit/bba1f735e107d9cc86880e9f869413bc7072bff8) Thanks [@gerardopar](https://github.com/gerardopar)! - fix: [LC-1654] - Fix Shared / Requested Insights

-   Updated dependencies [[`bba1f735e107d9cc86880e9f869413bc7072bff8`](https://github.com/learningeconomy/LearnCard/commit/bba1f735e107d9cc86880e9f869413bc7072bff8), [`fce9d2fd32898cfc64c59b88ca644dea3b53d1a5`](https://github.com/learningeconomy/LearnCard/commit/fce9d2fd32898cfc64c59b88ca644dea3b53d1a5)]:
    -   @learncard/types@5.13.2
    -   @learncard/helpers@1.2.12
    -   @learncard/lca-api-plugin@1.2.2
    -   @learncard/ler-rs-plugin@0.1.3
    -   @learncard/sss-key-manager@0.1.2

## 0.1.23

### Patch Changes

-   [#1097](https://github.com/learningeconomy/LearnCard/pull/1097) [`26de4ce53c2e8b6c2bb3e461789e976178250179`](https://github.com/learningeconomy/LearnCard/commit/26de4ce53c2e8b6c2bb3e461789e976178250179) Thanks [@gerardopar](https://github.com/gerardopar)! - fix: LC-1674 - Enhance CLR Credential

-   [#1089](https://github.com/learningeconomy/LearnCard/pull/1089) [`2e9ca79c1e8fb375ca0cc5f3cba0afcdd40d8915`](https://github.com/learningeconomy/LearnCard/commit/2e9ca79c1e8fb375ca0cc5f3cba0afcdd40d8915) Thanks [@smurflo2](https://github.com/smurflo2)! - Add My Skills Profile (version 1) to AI Pathways

-   [#1100](https://github.com/learningeconomy/LearnCard/pull/1100) [`81e621d020be1fd58fdb690888b22162129c4888`](https://github.com/learningeconomy/LearnCard/commit/81e621d020be1fd58fdb690888b22162129c4888) Thanks [@smurflo2](https://github.com/smurflo2)! - Various Family Fixes. Correctly show child name + image when switching. Use parent's image in PIN modal.

-   [#1085](https://github.com/learningeconomy/LearnCard/pull/1085) [`e8c886eac8907e127805e760c9622118c80c7bf5`](https://github.com/learningeconomy/LearnCard/commit/e8c886eac8907e127805e760c9622118c80c7bf5) Thanks [@rhen92](https://github.com/rhen92)! - feat: [LC-1639] Download CSV of Analytics from App Dashboard

-   [#1096](https://github.com/learningeconomy/LearnCard/pull/1096) [`b601eabb482807f07b85f55fd1893ed6c60cef65`](https://github.com/learningeconomy/LearnCard/commit/b601eabb482807f07b85f55fd1893ed6c60cef65) Thanks [@goblincore](https://github.com/goblincore)! - fix: [LC-1683] App Listing login redirect not working

-   [#1111](https://github.com/learningeconomy/LearnCard/pull/1111) [`c109634abe085eed5b71a1003a10529d3b2875e4`](https://github.com/learningeconomy/LearnCard/commit/c109634abe085eed5b71a1003a10529d3b2875e4) Thanks [@rhen92](https://github.com/rhen92)! - fix: [LC-1682] Misc bug fixes

-   Updated dependencies [[`c83e3de987c11a6d95deec31c1fdb2401a990db2`](https://github.com/learningeconomy/LearnCard/commit/c83e3de987c11a6d95deec31c1fdb2401a990db2), [`fe4a1a265132271860460b8121e28ec0eacf4cb0`](https://github.com/learningeconomy/LearnCard/commit/fe4a1a265132271860460b8121e28ec0eacf4cb0)]:
    -   @learncard/types@5.13.1
    -   @learncard/helpers@1.2.11
    -   @learncard/lca-api-plugin@1.2.1
    -   @learncard/ler-rs-plugin@0.1.2
    -   @learncard/sss-key-manager@0.1.1

## 0.1.22

### Patch Changes

-   [#1065](https://github.com/learningeconomy/LearnCard/pull/1065) [`3935a7c28ded7270133496f30562bad54a14f200`](https://github.com/learningeconomy/LearnCard/commit/3935a7c28ded7270133496f30562bad54a14f200) Thanks [@rhen92](https://github.com/rhen92)! - feat: [LC-1638] In-App "Creds You've Earned" Dashboard

-   [#1064](https://github.com/learningeconomy/LearnCard/pull/1064) [`48c46c2d2484cd0fe79bcca9d4bd0fb35297546a`](https://github.com/learningeconomy/LearnCard/commit/48c46c2d2484cd0fe79bcca9d4bd0fb35297546a) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1636][LC-1382] “Embed Claim Button” Guide + Embed design iteration

-   [#1075](https://github.com/learningeconomy/LearnCard/pull/1075) [`50fa611b714ae47fa3d6d56e7751ba59b5b71322`](https://github.com/learningeconomy/LearnCard/commit/50fa611b714ae47fa3d6d56e7751ba59b5b71322) Thanks [@smurflo2](https://github.com/smurflo2)! - Add guardianGatedRoute so backend has access to isChildProfile and hasGuardianApproval

-   Updated dependencies [[`50fa611b714ae47fa3d6d56e7751ba59b5b71322`](https://github.com/learningeconomy/LearnCard/commit/50fa611b714ae47fa3d6d56e7751ba59b5b71322), [`34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c`](https://github.com/learningeconomy/LearnCard/commit/34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c)]:
    -   @learncard/helpers@1.2.10
    -   @learncard/sss-key-manager@0.1.0
    -   @learncard/types@5.13.0
    -   @learncard/lca-api-plugin@1.2.0
    -   @learncard/ler-rs-plugin@0.1.1

## 0.1.21

### Patch Changes

-   [#1051](https://github.com/learningeconomy/LearnCard/pull/1051) [`e15dafbc571e8c63fa4fddcfbb03e87d495b01ff`](https://github.com/learningeconomy/LearnCard/commit/e15dafbc571e8c63fa4fddcfbb03e87d495b01ff) Thanks [@Custard7](https://github.com/Custard7)! - fix: Category Map Error

## 0.1.20

### Patch Changes

-   Updated dependencies []:
    -   @learncard/helpers@1.2.9
    -   @learncard/lca-api-plugin@1.1.17

## 0.1.19

### Patch Changes

-   [#1036](https://github.com/learningeconomy/LearnCard/pull/1036) [`14980c4c2b8ff739afa1a2c915884df1c8517770`](https://github.com/learningeconomy/LearnCard/commit/14980c4c2b8ff739afa1a2c915884df1c8517770) Thanks [@Custard7](https://github.com/Custard7)! - fix: Null URL Helper

-   [#1031](https://github.com/learningeconomy/LearnCard/pull/1031) [`495f2939cb6e4271cab0a88abea5105fb7e4f9b6`](https://github.com/learningeconomy/LearnCard/commit/495f2939cb6e4271cab0a88abea5105fb7e4f9b6) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: [LC-982][LC-1625] - extend default boost permissions, add "canView"

-   Updated dependencies []:
    -   @learncard/helpers@1.2.8
    -   @learncard/lca-api-plugin@1.1.16

## 0.1.18

### Patch Changes

-   [#1006](https://github.com/learningeconomy/LearnCard/pull/1006) [`caf231b53707174ea49f0eb2b65885a36b3e7228`](https://github.com/learningeconomy/LearnCard/commit/caf231b53707174ea49f0eb2b65885a36b3e7228) Thanks [@smurflo2](https://github.com/smurflo2)! - Add Self-Assigned Skills including optional proficiency level field on Boost -> Skill relationship

-   [#1025](https://github.com/learningeconomy/LearnCard/pull/1025) [`35179e0ed8d7694e42efe2ea4bc6f60a96f8bf0e`](https://github.com/learningeconomy/LearnCard/commit/35179e0ed8d7694e42efe2ea4bc6f60a96f8bf0e) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: [LC-1608][LC-1609] - Resume Builder + Resume Generation

-   Updated dependencies []:
    -   @learncard/helpers@1.2.7
    -   @learncard/lca-api-plugin@1.1.15

## 0.1.17

### Patch Changes

-   [#973](https://github.com/learningeconomy/LearnCard/pull/973) [`5b76830d328bd38b4f184458414ef478c9cc118a`](https://github.com/learningeconomy/LearnCard/commit/5b76830d328bd38b4f184458414ef478c9cc118a) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1510] [LC-1508] Replace temporary revoke for scouts with a more comprehensive solution

-   [#1009](https://github.com/learningeconomy/LearnCard/pull/1009) [`db1f854739a3238b93e594c59f8ed4b58635185f`](https://github.com/learningeconomy/LearnCard/commit/db1f854739a3238b93e594c59f8ed4b58635185f) Thanks [@gerardopar](https://github.com/gerardopar)! - fix: LC-1422 - validate file uploads (resumes, transcripts, certificates, etc) + fix toast styles

-   [#971](https://github.com/learningeconomy/LearnCard/pull/971) [`a5e21c66edcff63a75603e741b6907800bf8c984`](https://github.com/learningeconomy/LearnCard/commit/a5e21c66edcff63a75603e741b6907800bf8c984) Thanks [@gerardopar](https://github.com/gerardopar)! - LC-1501 - AI Insight Sessions

-   [#992](https://github.com/learningeconomy/LearnCard/pull/992) [`42849fe9be2e6654708546c2cc360589e5745fd5`](https://github.com/learningeconomy/LearnCard/commit/42849fe9be2e6654708546c2cc360589e5745fd5) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: LC-1503 - Add streamMode Support for Structured Plan Streaming

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.14

## 0.1.16

### Patch Changes

-   [#989](https://github.com/learningeconomy/LearnCard/pull/989) [`4d4f0d30a69f6228ff66a5ebfe891331670ffc6b`](https://github.com/learningeconomy/LearnCard/commit/4d4f0d30a69f6228ff66a5ebfe891331670ffc6b) Thanks [@rhen92](https://github.com/rhen92)! - feat: [LC-1423] Move xAPI statements into "Manage Data Sharing" based on contract

-   [#1001](https://github.com/learningeconomy/LearnCard/pull/1001) [`3e2e71af075cef55039ae39baa902f76f7b5fa34`](https://github.com/learningeconomy/LearnCard/commit/3e2e71af075cef55039ae39baa902f76f7b5fa34) Thanks [@gerardopar](https://github.com/gerardopar)! - chore: LC-1586 - Migrate AI Tutor Apps to use Official App Store

-   [#988](https://github.com/learningeconomy/LearnCard/pull/988) [`3ea5b9d4b65e1344d0639e84f6fa27d1cef12a3f`](https://github.com/learningeconomy/LearnCard/commit/3ea5b9d4b65e1344d0639e84f6fa27d1cef12a3f) Thanks [@gerardopar](https://github.com/gerardopar)! - chore: LC-1373 - Update CMS Thumbnail (Add Media Type preview)

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.13

## 0.1.15

### Patch Changes

-   [#987](https://github.com/learningeconomy/LearnCard/pull/987) [`f9e1902456c88b5db3fcd7b934956b139796fa0c`](https://github.com/learningeconomy/LearnCard/commit/f9e1902456c88b5db3fcd7b934956b139796fa0c) Thanks [@smurflo2](https://github.com/smurflo2)! - [LC-1578] Optimize skill framework uploads (aka fix timeout error)

-   Updated dependencies []:
    -   @learncard/helpers@1.2.6
    -   @learncard/lca-api-plugin@1.1.12

## 0.1.14

### Patch Changes

-   [#968](https://github.com/learningeconomy/LearnCard/pull/968) [`01572c1731b01c60926e1e1ff4db95ddf08e6e9e`](https://github.com/learningeconomy/LearnCard/commit/01572c1731b01c60926e1e1ff4db95ddf08e6e9e) Thanks [@Custard7](https://github.com/Custard7)! - chore: Silence and Fix Warnings/Errors

-   Updated dependencies []:
    -   @learncard/helpers@1.2.5
    -   @learncard/lca-api-plugin@1.1.11

## 0.1.13

### Patch Changes

-   [#965](https://github.com/learningeconomy/LearnCard/pull/965) [`4e87c9cee7fdab315f95f367b66752883cb4575d`](https://github.com/learningeconomy/LearnCard/commit/4e87c9cee7fdab315f95f367b66752883cb4575d) Thanks [@rhen92](https://github.com/rhen92)! - fix: [LC-1478] Archive All button does not archive for my account

-   [#969](https://github.com/learningeconomy/LearnCard/pull/969) [`d2b259d3afabd9509d96d8879c6080fcd707f3d6`](https://github.com/learningeconomy/LearnCard/commit/d2b259d3afabd9509d96d8879c6080fcd707f3d6) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Resolve app DIDs in credential UI and show app issuer details.

    Credentials issued by App Store listings now map app did:web values to
    app names/icons (with a link back to the app), and display the "App Issuer"
    verification state where appropriate.

-   Updated dependencies [[`d2b259d3afabd9509d96d8879c6080fcd707f3d6`](https://github.com/learningeconomy/LearnCard/commit/d2b259d3afabd9509d96d8879c6080fcd707f3d6)]:
    -   @learncard/lca-api-plugin@1.1.10

## 0.1.12

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.9

## 0.1.11

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.8

## 0.1.10

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.7

## 0.1.9

### Patch Changes

-   [#952](https://github.com/learningeconomy/LearnCard/pull/952) [`e41a15b2b2850fc3c562b254b3aef707d34e5437`](https://github.com/learningeconomy/LearnCard/commit/e41a15b2b2850fc3c562b254b3aef707d34e5437) Thanks [@Custard7](https://github.com/Custard7)! - fix: Encrypt for Recipient with SA

## 0.1.8

### Patch Changes

-   [#933](https://github.com/learningeconomy/LearnCard/pull/933) [`1247b3b2b372626b06d6193b5c9227504c23a3be`](https://github.com/learningeconomy/LearnCard/commit/1247b3b2b372626b06d6193b5c9227504c23a3be) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1511] Override unknown issuer verifier state text and use roles in Scouts app

-   [#934](https://github.com/learningeconomy/LearnCard/pull/934) [`6319f43e11a231396f08b41a0bafb4198b4622a0`](https://github.com/learningeconomy/LearnCard/commit/6319f43e11a231396f08b41a0bafb4198b4622a0) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1524] fix: Suppress toast displaying "Registration: no valid private key error" on login screen

-   [#933](https://github.com/learningeconomy/LearnCard/pull/933) [`1247b3b2b372626b06d6193b5c9227504c23a3be`](https://github.com/learningeconomy/LearnCard/commit/1247b3b2b372626b06d6193b5c9227504c23a3be) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1511] Override unknown issuer verifier state text and use roles in Scouts app

-   [#938](https://github.com/learningeconomy/LearnCard/pull/938) [`20c48c727aade41921e226e3f26922d3798c7b5e`](https://github.com/learningeconomy/LearnCard/commit/20c48c727aade41921e226e3f26922d3798c7b5e) Thanks [@gerardopar](https://github.com/gerardopar)! - chore: [LC-1498] - 🚀 Migrate Capacitor & Plugins from v7 → v8 + 🔥 Firebase v12

-   [#938](https://github.com/learningeconomy/LearnCard/pull/938) [`20c48c727aade41921e226e3f26922d3798c7b5e`](https://github.com/learningeconomy/LearnCard/commit/20c48c727aade41921e226e3f26922d3798c7b5e) Thanks [@gerardopar](https://github.com/gerardopar)! - chore: [LC-1498] - 🚀 Migrate Capacitor & Plugins from v7 → v8 + 🔥 Firebase v12

## 0.1.7

### Patch Changes

-   Updated dependencies []:
    -   @learncard/helpers@1.2.4
    -   @learncard/lca-api-plugin@1.1.6

## 0.1.6

### Patch Changes

-   [#920](https://github.com/learningeconomy/LearnCard/pull/920) [`49abe4ecae0e9eaa446668dbb23abc6ff64793e5`](https://github.com/learningeconomy/LearnCard/commit/49abe4ecae0e9eaa446668dbb23abc6ff64793e5) Thanks [@rhen92](https://github.com/rhen92)! - chore: [LC-1505] Change skills to competencies for ScoutPass

-   Updated dependencies []:
    -   @learncard/helpers@1.2.3
    -   @learncard/lca-api-plugin@1.1.5

## 0.1.5

### Patch Changes

-   [#912](https://github.com/learningeconomy/LearnCard/pull/912) [`e61da3230f946b3d7238588baad502b16cee3ea1`](https://github.com/learningeconomy/LearnCard/commit/e61da3230f946b3d7238588baad502b16cee3ea1) Thanks [@Custard7](https://github.com/Custard7)! - feat: In-App CLI

## 0.1.4

### Patch Changes

-   Updated dependencies []:
    -   @learncard/helpers@1.2.2
    -   @learncard/lca-api-plugin@1.1.4

## 0.1.3

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.3

## 0.1.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/helpers@1.2.1
    -   @learncard/lca-api-plugin@1.1.2

## 0.1.1

### Patch Changes

-   [#892](https://github.com/learningeconomy/LearnCard/pull/892) [`72dd77fd6b2cf455f36a9b05a629adb32c144b4b`](https://github.com/learningeconomy/LearnCard/commit/72dd77fd6b2cf455f36a9b05a629adb32c144b4b) Thanks [@rhen92](https://github.com/rhen92)! - fix: [LC-1479] Can't switch themes as an organization account

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.1

## 0.1.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - feat: App Store CRUD & Partner Portal

-   [#880](https://github.com/learningeconomy/LearnCard/pull/880) [`1e25b1cb990fb1e2af9d887da77c265e2a875fd5`](https://github.com/learningeconomy/LearnCard/commit/1e25b1cb990fb1e2af9d887da77c265e2a875fd5) Thanks [@gerardopar](https://github.com/gerardopar)! - fix: Logout Behavior

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/lca-api-plugin@1.1.0
    -   @learncard/helpers@1.2.0

## 0.0.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.0.1
