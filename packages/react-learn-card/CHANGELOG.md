# @welibraryos/react-learn-card

## 2.6.10

### Patch Changes

-   [#322](https://github.com/learningeconomy/LearnCard/pull/322) [`bde35ba`](https://github.com/learningeconomy/LearnCard/commit/bde35baa4821688e97d49e5f5ea2c3f3748e5327) Thanks [@gerardopar](https://github.com/gerardopar)! - bump react to v18

-   Updated dependencies []:
    -   @learncard/init@1.0.8

## 2.6.9

### Patch Changes

-   [#318](https://github.com/learningeconomy/LearnCard/pull/318) [`ba70a92`](https://github.com/learningeconomy/LearnCard/commit/ba70a922be3f9ac9db8c2dbaf6beade4d678dce0) Thanks [@Cyntheon](https://github.com/Cyntheon)! - Add default lightbox implementation for boost attachments

-   Updated dependencies [[`a0b62f3`](https://github.com/learningeconomy/LearnCard/commit/a0b62f351d32c4e0a788b519dd852aa5df9e6c8a)]:
    -   @learncard/init@1.0.7

## 2.6.8

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.6

## 2.6.7

### Patch Changes

-   [#310](https://github.com/learningeconomy/LearnCard/pull/310) [`0c53923`](https://github.com/learningeconomy/LearnCard/commit/0c539231aeb26ebaaa07e7fca6be8a216f30c399) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix weird text display issue

## 2.6.6

### Patch Changes

-   [#307](https://github.com/learningeconomy/LearnCard/pull/307) [`ea1fc75`](https://github.com/learningeconomy/LearnCard/commit/ea1fc7593ebdc8b2800dd034b04b6653fad2171d) Thanks [@Cyntheon](https://github.com/Cyntheon)! - Update rollup config to fix learncardapp bug when using local @learncard/react package

## 2.6.5

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.5

## 2.6.4

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.4

## 2.6.3

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.3

## 2.6.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.2

## 2.6.1

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.1

## 2.6.0

### Minor Changes

-   [#300](https://github.com/learningeconomy/LearnCard/pull/300) [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - BREAKING CHANGE: Split @learncard/core into multiple plugin packages and @learncard/init.

    _Breaking Changes_

    -   `initLearnCard` is no longer exported by `@learncard/core`, as it is now the responsibility of `@learncard/init`

    ```ts
    // Old
    const { initLearnCard } from '@learncard/core';

    // New
    const { initLearnCard } from '@learncard/init';
    ```

    -   The didkit wasm binary is no longer exported by `@learncard/core` as it is now the responsibility of `@learncard/didkit-plugin`

    ```ts
    // Old
    import didkit from '@learncard/core/dist/didkit/didkit_wasm_bg.wasm';

    // New
    import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm';
    ```

    -   `@learncard/network-plugin` and `@learncard/did-web-plugin` no longer export their own version of `initLearnCard`, and are instead now proper instantiation targets from `@learncard/init`

    ```ts
    // Old
    import { initNetworkLearnCard } from '@learncard/network-plugin';
    import { initDidWebLearnCard } from '@learncard/did-web-plugin';

    const networkLearnCard = await initNetworkLearnCard({ seed: 'a'.repeat(64) });
    const didWebLearnCard = await initDidWebLearnCard({
        seed: 'a'.repeat(64),
        didWeb: 'did:web:test',
    });

    // New
    import { initLearnCard } from '@learncard/init';

    const networkLearnCard = await initLearnCard({ seed: 'a'.repeat(64), network: true });
    const didWebLearnCard = await initLearnCard({ seed: 'a'.repeat(64), didWeb: 'did:web:test' });
    ```

### Patch Changes

-   Updated dependencies [[`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209)]:
    -   @learncard/init@1.0.0

## 2.5.20

### Patch Changes

-   [#295](https://github.com/learningeconomy/LearnCard/pull/295) [`2008848`](https://github.com/learningeconomy/LearnCard/commit/2008848ddfc34af0c1a92261b45ff0d7e15a0f59) Thanks [@goblincore](https://github.com/goblincore)! - Add additional options button on Boost display cards

## 2.5.19

### Patch Changes

-   [#292](https://github.com/learningeconomy/LearnCard/pull/292) [`e081c19`](https://github.com/learningeconomy/LearnCard/commit/e081c19cb9c3d1a4ae45a7a47b120ec16287d9df) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Small style fixes for VC Cards

## 2.5.18

### Patch Changes

-   [`74e459d`](https://github.com/learningeconomy/LearnCard/commit/74e459d0089497cbf031d18305f33fa539f2a96f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Empty version bump

-   Updated dependencies []:
    -   @learncard/core@8.5.5

## 2.5.17

### Patch Changes

-   [#289](https://github.com/learningeconomy/LearnCard/pull/289) [`4787227`](https://github.com/learningeconomy/LearnCard/commit/4787227c2e8a2b4ffa4c8b177920f80feed8a64b) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Don't show check if it's not needed in VCDisplayCard2

-   Updated dependencies []:
    -   @learncard/core@8.5.5

## 2.5.16

### Patch Changes

-   [#287](https://github.com/learningeconomy/LearnCard/pull/287) [`337e061`](https://github.com/learningeconomy/LearnCard/commit/337e061c0eef5ade2d5f7cc36f5e84e5dd4d5f12) Thanks [@gerardopar](https://github.com/gerardopar)! - Support custom issue history component

## 2.5.15

### Patch Changes

-   [#283](https://github.com/learningeconomy/LearnCard/pull/283) [`daf6eaf`](https://github.com/learningeconomy/LearnCard/commit/daf6eafd167689c995378c792a0e459632293092) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Minor VCDisplayCard2 updates

## 2.5.14

### Patch Changes

-   No change, just forcible version bump

-   Updated dependencies []:
    -   @learncard/core@8.5.5

## 2.5.13

### Patch Changes

-   [#275](https://github.com/learningeconomy/LearnCard/pull/275) [`798a22c`](https://github.com/learningeconomy/LearnCard/commit/798a22cbd296495eb365e85c7c8d1bd293ba2b34) Thanks [@gerardopar](https://github.com/gerardopar)! - Vc display card updates

## 2.5.12

### Patch Changes

-   [#270](https://github.com/learningeconomy/LearnCard/pull/270) [`5cc4fce`](https://github.com/learningeconomy/LearnCard/commit/5cc4fce1fcdfaedf6d50e5e7e99df37ff06ae393) Thanks [@goblincore](https://github.com/goblincore)! - fix: Export notification card components properly

## 2.5.11

### Patch Changes

-   [#268](https://github.com/learningeconomy/LearnCard/pull/268) [`fdbce48`](https://github.com/learningeconomy/LearnCard/commit/fdbce48c2c0a467c1ae480f6dcc4ae377de51aab) Thanks [@goblincore](https://github.com/goblincore)! - Add updated LCA notification card components

## 2.5.10

### Patch Changes

-   Updated dependencies [[`f6abbd4`](https://github.com/learningeconomy/LearnCard/commit/f6abbd490e02f65d56465ec5853aa31cfd2ae40c)]:
    -   @learncard/core@8.5.4

## 2.5.9

### Patch Changes

-   [#253](https://github.com/learningeconomy/LearnCard/pull/253) [`c769bc1`](https://github.com/learningeconomy/LearnCard/commit/c769bc19d0eb7b16f11af0a70f4342f9f45ed79d) Thanks [@gerardopar](https://github.com/gerardopar)! - fix: update social badge icon

## 2.5.8

### Patch Changes

-   [#249](https://github.com/learningeconomy/LearnCard/pull/249) [`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1) Thanks [@goblincore](https://github.com/goblincore)! - Republish

-   Updated dependencies [[`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1)]:
    -   @learncard/core@8.5.3

## 2.5.7

### Patch Changes

-   [#245](https://github.com/learningeconomy/LearnCard/pull/245) [`790bae6`](https://github.com/learningeconomy/LearnCard/commit/790bae6b844263318ec0660fa269c2a43b9d4716) Thanks [@gerardopar](https://github.com/gerardopar)! - notification style updates

## 2.5.6

### Patch Changes

-   Updated dependencies [[`f1a8679`](https://github.com/learningeconomy/LearnCard/commit/f1a86796817fa20a0667a6b717b56d22038028c1)]:
    -   @learncard/core@8.5.2

## 2.5.5

### Patch Changes

-   [#239](https://github.com/learningeconomy/LearnCard/pull/239) [`4153ea0`](https://github.com/learningeconomy/LearnCard/commit/4153ea0dd3b3c562876308ba27a6060ef76ebac9) Thanks [@goblincore](https://github.com/goblincore)! - chore: small boost card update - fix inner click handler container wrapping button, add tailwind css cursor class to clickable region

## 2.5.4

### Patch Changes

-   [#235](https://github.com/learningeconomy/LearnCard/pull/235) [`f7404ea`](https://github.com/learningeconomy/LearnCard/commit/f7404ea710a09aa0b6a5f701ff3bb27bd105f5e7) Thanks [@goblincore](https://github.com/goblincore)! - Small Boost card updates, add BoostGenericCard

## 2.5.3

### Patch Changes

-   Updated dependencies [[`13d0393`](https://github.com/learningeconomy/LearnCard/commit/13d0393725d9d5e17b02de7a8088f46bda688d92), [`ed3c460`](https://github.com/learningeconomy/LearnCard/commit/ed3c460fadae88702c1244795ab3b7483d97bab7)]:
    -   @learncard/core@8.5.1

## 2.5.2

### Patch Changes

-   [#226](https://github.com/learningeconomy/LearnCard/pull/226) [`ad7f281`](https://github.com/learningeconomy/LearnCard/commit/ad7f281d6ed1fe1c33601defe71f2714f8675f45) Thanks [@goblincore](https://github.com/goblincore)! - Add additional optional prop to VCDisplayCard2 and fix VC type display

## 2.5.1

### Patch Changes

-   [#225](https://github.com/learningeconomy/LearnCard/pull/225) [`d29a2d5`](https://github.com/learningeconomy/LearnCard/commit/d29a2d5dd0d4ac1c7f178dc0d00956561012a1fb) Thanks [@gerardopar](https://github.com/gerardopar)! - fix notification tests

-   [#223](https://github.com/learningeconomy/LearnCard/pull/223) [`2707350`](https://github.com/learningeconomy/LearnCard/commit/27073505a7e0c4f4ec8fef191fbff16d97c5d74a) Thanks [@goblincore](https://github.com/goblincore)! - Add Small Boost Card and update VCDisplayCard2 with additional props for overriding parts of the card display (body, thumb, footer) and adds support for displaying an issue history

-   [#221](https://github.com/learningeconomy/LearnCard/pull/221) [`c997138`](https://github.com/learningeconomy/LearnCard/commit/c9971386188169859bbe9e8ef7da6572432ed3f0) Thanks [@gerardopar](https://github.com/gerardopar)! - Update notification types - ( add social badge )

-   [#224](https://github.com/learningeconomy/LearnCard/pull/224) [`8fbee11`](https://github.com/learningeconomy/LearnCard/commit/8fbee11a07df86ba7d3fdee7430a7288b6ba321f) Thanks [@goblincore](https://github.com/goblincore)! - Update BoostSmallCard with additional click handler prop

## 2.5.0

### Minor Changes

-   [#217](https://github.com/learningeconomy/LearnCard/pull/217) [`df2aa4e`](https://github.com/learningeconomy/LearnCard/commit/df2aa4ef50ed45c627d2d36b73aefab47da2bcc5) Thanks [@Custard7](https://github.com/Custard7)! - Updated React Components to have new VC display.

### Patch Changes

-   Updated dependencies [[`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe)]:
    -   @learncard/core@8.5.0

## 2.4.0

### Minor Changes

-   [#212](https://github.com/learningeconomy/LearnCard/pull/212) [`74b7264`](https://github.com/learningeconomy/LearnCard/commit/74b72643c85d715b1f93610e8bef16c282efd3ce) Thanks [@smurflo2](https://github.com/smurflo2)! - Add new VC Display!

### Patch Changes

-   [#211](https://github.com/learningeconomy/LearnCard/pull/211) [`406b9dc`](https://github.com/learningeconomy/LearnCard/commit/406b9dcb88a56395125e865672474283a15f1d03) Thanks [@gerardopar](https://github.com/gerardopar)! - WE-2604 - wallet page iterations (rounded square)

## 2.3.69

### Patch Changes

-   Updated dependencies [[`9652a2f`](https://github.com/learningeconomy/LearnCard/commit/9652a2f59bc305ed3ef4cd7d53731608f81a54c6)]:
    -   @learncard/core@8.4.2

## 2.3.68

### Patch Changes

-   [#207](https://github.com/learningeconomy/LearnCard/pull/207) [`1cb2e88`](https://github.com/learningeconomy/LearnCard/commit/1cb2e883792eba09e2adfc0e6ab386f6d6a274b2) Thanks [@goblincore](https://github.com/goblincore)! - Add additional prop to job listing card to override with custom button component

## 2.3.67

### Patch Changes

-   Updated dependencies [[`d2e5817`](https://github.com/learningeconomy/LearnCard/commit/d2e581790d63a75d304c2ace8b02133ce122c7ce)]:
    -   @learncard/core@8.4.1

## 2.3.66

### Patch Changes

-   Updated dependencies [[`e78c77d`](https://github.com/learningeconomy/LearnCard/commit/e78c77dc8dfa6c69d7163ed49b551bd739de2f09)]:
    -   @learncard/core@8.4.0

## 2.3.65

### Patch Changes

-   Updated dependencies [[`d6ebc5b`](https://github.com/learningeconomy/LearnCard/commit/d6ebc5baa52eab591398e81267adb40b3dce74f3)]:
    -   @learncard/core@8.3.1

## 2.3.64

### Patch Changes

-   Updated dependencies [[`d817fde`](https://github.com/learningeconomy/LearnCard/commit/d817fdecfc98023b3907451750338561df9d577c)]:
    -   @learncard/core@8.3.0

## 2.3.63

### Patch Changes

-   Updated dependencies [[`ace9b60`](https://github.com/learningeconomy/LearnCard/commit/ace9b60b02932e36090e7392a1b7b6a13a9593b8)]:
    -   @learncard/core@8.2.0

## 2.3.62

### Patch Changes

-   Updated dependencies [[`42d02db`](https://github.com/learningeconomy/LearnCard/commit/42d02dba24129983664aceb7da5aaeb4039f8b04)]:
    -   @learncard/core@8.1.1

## 2.3.61

### Patch Changes

-   Updated dependencies [[`36e938b`](https://github.com/learningeconomy/LearnCard/commit/36e938b1211b53b96962663e8b33b50f24b2ca51), [`36e938b`](https://github.com/learningeconomy/LearnCard/commit/36e938b1211b53b96962663e8b33b50f24b2ca51)]:
    -   @learncard/core@8.1.0

## 2.3.60

### Patch Changes

-   [#184](https://github.com/learningeconomy/LearnCard/pull/184) [`31b67a5`](https://github.com/learningeconomy/LearnCard/commit/31b67a5d6010ce3886406677a0aa838b778d64f8) Thanks [@Custard7](https://github.com/Custard7)! - Patch: Add react ux docs

## 2.3.59

### Patch Changes

-   [#179](https://github.com/learningeconomy/LearnCard/pull/179) [`f545ed4`](https://github.com/learningeconomy/LearnCard/commit/f545ed434dd23179591e3b7c0bd82bd9c2ae2fb2) Thanks [@goblincore](https://github.com/goblincore)! - chore: Update course card

## 2.3.58

### Patch Changes

-   [#177](https://github.com/learningeconomy/LearnCard/pull/177) [`bc746a0`](https://github.com/learningeconomy/LearnCard/commit/bc746a05fa6c4196e432fac20b5783221b59be65) Thanks [@goblincore](https://github.com/goblincore)! - chore: VC Card updates - add additional override props, generic card add check display and flipped display

-   [#170](https://github.com/learningeconomy/LearnCard/pull/170) [`c388fd4`](https://github.com/learningeconomy/LearnCard/commit/c388fd49f2832cadcb201779de17d45d3fe7b660) Thanks [@Custard7](https://github.com/Custard7)! - Fix: Update READMEs to 8.0 syntax

-   Updated dependencies [[`c388fd4`](https://github.com/learningeconomy/LearnCard/commit/c388fd49f2832cadcb201779de17d45d3fe7b660)]:
    -   @learncard/core@8.0.7

## 2.3.57

### Patch Changes

-   Updated dependencies [[`b3ae77e`](https://github.com/learningeconomy/LearnCard/commit/b3ae77ef20a10dee303a2c8318faa8bf28344215)]:
    -   @learncard/core@8.0.6

## 2.3.56

### Patch Changes

-   Updated dependencies [[`a3aafb3`](https://github.com/learningeconomy/LearnCard/commit/a3aafb39db6fccae19e999fb4fc89a588bc14555)]:
    -   @learncard/core@8.0.5

## 2.3.55

### Patch Changes

-   Updated dependencies [[`86f3541`](https://github.com/learningeconomy/LearnCard/commit/86f35413e6006a17a596d71ea3f186f915e90f28)]:
    -   @learncard/core@8.0.4

## 2.3.54

### Patch Changes

-   Updated dependencies [[`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3)]:
    -   @learncard/core@8.0.3

## 2.3.53

### Patch Changes

-   Updated dependencies [[`7c6945c`](https://github.com/learningeconomy/LearnCard/commit/7c6945cfe4be8574c869c2515f7806123c372765)]:
    -   @learncard/core@8.0.2

## 2.3.52

### Patch Changes

-   [#151](https://github.com/learningeconomy/LearnCard/pull/151) [`88df9f8`](https://github.com/learningeconomy/LearnCard/commit/88df9f8c34f2d258845a62c3a214e9a382796f1e) Thanks [@goblincore](https://github.com/goblincore)! - chore: Add override props for VC display card

*   [#151](https://github.com/learningeconomy/LearnCard/pull/151) [`88df9f8`](https://github.com/learningeconomy/LearnCard/commit/88df9f8c34f2d258845a62c3a214e9a382796f1e) Thanks [@goblincore](https://github.com/goblincore)! - chore: Add override props for VC display card

## 2.3.51

### Patch Changes

-   [#149](https://github.com/learningeconomy/LearnCard/pull/149) [`abec576`](https://github.com/learningeconomy/LearnCard/commit/abec576ab55bd9874d487e6ae13b5976a7d52c4e) Thanks [@Custard7](https://github.com/Custard7)! - Fix image for jff 2.0 badge

*   [#150](https://github.com/learningeconomy/LearnCard/pull/150) [`2851dcd`](https://github.com/learningeconomy/LearnCard/commit/2851dcd70129a4e84b78c62bbd2de05d871edd76) Thanks [@goblincore](https://github.com/goblincore)! - Actually fix image for jff 2.0 badge

*   Updated dependencies [[`1cafab4`](https://github.com/learningeconomy/LearnCard/commit/1cafab43a6c053914305e0a8b938748ed2a5fd31)]:
    -   @learncard/core@8.0.1

## 2.3.50

### Patch Changes

-   [#142](https://github.com/learningeconomy/LearnCard/pull/142) [`b9bab6e`](https://github.com/learningeconomy/LearnCard/commit/b9bab6ec68db49ffda5163811a61211811f0b0fe) Thanks [@goblincore](https://github.com/goblincore)! - chore: VC Display card update

## 2.3.49

### Patch Changes

-   Updated dependencies [[`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9), [`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9)]:
    -   @learncard/core@8.0.0

## 2.3.48

### Patch Changes

-   [#137](https://github.com/learningeconomy/LearnCard/pull/137) [`b655513`](https://github.com/learningeconomy/LearnCard/commit/b6555139a5fcf653db514d8ee059bd9edd99fd54) Thanks [@goblincore](https://github.com/goblincore)! - chore: School ID card additional props and default image placeholder options

## 2.3.47

### Patch Changes

-   [#135](https://github.com/learningeconomy/LearnCard/pull/135) [`235c773`](https://github.com/learningeconomy/LearnCard/commit/235c7731aded77985cf9083c09c6200ff8599766) Thanks [@goblincore](https://github.com/goblincore)! - chore: rounded square update - add back constant exports and left justify title

## 2.3.46

### Patch Changes

-   [#133](https://github.com/learningeconomy/LearnCard/pull/133) [`f12e6b0`](https://github.com/learningeconomy/LearnCard/commit/f12e6b03b078ef5861a657de52f48fb28eb2660e) Thanks [@goblincore](https://github.com/goblincore)! - Generic Card Update

## 2.3.45

### Patch Changes

-   [#131](https://github.com/learningeconomy/LearnCard/pull/131) [`dd4931f`](https://github.com/learningeconomy/LearnCard/commit/dd4931f9e439c4f80b16c6f438aff3e4eee6b8af) Thanks [@goblincore](https://github.com/goblincore)! - Hide VC image when no image for vc, course card additional hide header prop, css changes for generic display card

## 2.3.44

### Patch Changes

-   [#128](https://github.com/learningeconomy/LearnCard/pull/128) [`e67119e`](https://github.com/learningeconomy/LearnCard/commit/e67119e978d4df324aa71235c3b202b3e8bdde7c) Thanks [@goblincore](https://github.com/goblincore)! - Small UI updates - add generic display card, job history card, update job listing card

## 2.3.43

### Patch Changes

-   Updated dependencies [[`2a4f635`](https://github.com/learningeconomy/LearnCard/commit/2a4f63521b2ce68961868359873064a25394dd99)]:
    -   @learncard/core@7.0.3

## 2.3.42

### Patch Changes

-   Updated dependencies [[`00b119a`](https://github.com/learningeconomy/LearnCard/commit/00b119a56769bcdc921502a5ad0591d07ad667e8)]:
    -   @learncard/core@7.0.2

## 2.3.41

### Patch Changes

-   [#118](https://github.com/learningeconomy/LearnCard/pull/118) [`7f98a90`](https://github.com/learningeconomy/LearnCard/commit/7f98a90df1e3ee8c2d39cabc754c6655e6072aa0) Thanks [@gerardopar](https://github.com/gerardopar)! - fix vc display card styles

## 2.3.40

### Patch Changes

-   Updated dependencies [[`e8f1ba3`](https://github.com/learningeconomy/LearnCard/commit/e8f1ba3594bc749caf18959962da4b85c97db4a6)]:
    -   @learncard/core@7.0.1

## 2.3.39

### Patch Changes

-   Updated dependencies [[`25349fe`](https://github.com/learningeconomy/LearnCard/commit/25349fe064c751a004092bcab24e1674fadfd5fe)]:
    -   @learncard/core@7.0.0

## 2.3.38

### Patch Changes

-   [#109](https://github.com/learningeconomy/LearnCard/pull/109) [`8843fda`](https://github.com/learningeconomy/LearnCard/commit/8843fda579ffb9b8adbb4d467143207e20dfe305) Thanks [@gerardopar](https://github.com/gerardopar)! - [WE-2405] - update components with profile images

-   Updated dependencies [[`27e4ecd`](https://github.com/learningeconomy/LearnCard/commit/27e4ecd6641cf16b97d198434250f55135d09e97)]:
    -   @learncard/core@6.4.0

## 2.3.37

### Patch Changes

-   Updated dependencies [[`e085abd`](https://github.com/learningeconomy/LearnCard/commit/e085abd72d3b4c085cdfc5c623864b40e35cf302)]:
    -   @learncard/core@6.3.1

## 2.3.36

### Patch Changes

-   Updated dependencies [[`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0)]:
    -   @learncard/core@6.3.0

## 2.3.35

### Patch Changes

-   [#101](https://github.com/learningeconomy/LearnCard/pull/101) [`08c1c30`](https://github.com/learningeconomy/LearnCard/commit/08c1c30e24a65853c0e04ae1c775d79cd55628e1) Thanks [@goblincore](https://github.com/goblincore)! - Add SkilTabCard, CircleCheckButton, Course Vertical Card, some light refactoring and updated types and props, main addition is checkmark related functionality to various card components

## 2.3.34

### Patch Changes

-   [#98](https://github.com/learningeconomy/LearnCard/pull/98) [`d85b8dc`](https://github.com/learningeconomy/LearnCard/commit/d85b8dce25482d7acff7b0629da53e51a09dcc9e) Thanks [@goblincore](https://github.com/goblincore)! - [WE-2345] Achievement display card update with status and skills

*   [#98](https://github.com/learningeconomy/LearnCard/pull/98) [`d85b8dc`](https://github.com/learningeconomy/LearnCard/commit/d85b8dce25482d7acff7b0629da53e51a09dcc9e) Thanks [@goblincore](https://github.com/goblincore)! - Achievement display card update with status and skills

## 2.3.33

### Patch Changes

-   [#95](https://github.com/learningeconomy/LearnCard/pull/95) [`426702f`](https://github.com/learningeconomy/LearnCard/commit/426702f50b8790a8eeb68908331a79c79043f4f5) Thanks [@goblincore](https://github.com/goblincore)! - Add Mini-Job display card

## 2.3.32

### Patch Changes

-   [#94](https://github.com/learningeconomy/LearnCard/pull/94) [`4e5cc2f`](https://github.com/learningeconomy/LearnCard/commit/4e5cc2fe935f99ca663bc9b7d75db2a86c0b7b23) Thanks [@smurflo2](https://github.com/smurflo2)! - Add children to credit card front face

## 2.3.31

### Patch Changes

-   Updated dependencies [[`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342)]:
    -   @learncard/core@6.2.0

## 2.3.30

### Patch Changes

-   Updated dependencies [[`c1befdc`](https://github.com/learningeconomy/LearnCard/commit/c1befdc8a30d3cc111d938c530493b1a5b87aa00)]:
    -   @learncard/core@6.1.0

## 2.3.29

### Patch Changes

-   [#82](https://github.com/learningeconomy/LearnCard/pull/82) [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update ReadMe

-   Updated dependencies [[`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104), [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104), [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104)]:
    -   @learncard/core@6.0.0

## 2.3.28

### Patch Changes

-   [#40](https://github.com/learningeconomy/LearnCard/pull/40) [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Mark @learncard/core as external

*   [#40](https://github.com/learningeconomy/LearnCard/pull/40) [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix VCCard erroring from invalid key

*   Updated dependencies [[`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562), [`074989f`](https://github.com/learningeconomy/LearnCard/commit/074989f2eb4b7d8cb9b2d6a62451cdcf047d72d5), [`120744b`](https://github.com/learningeconomy/LearnCard/commit/120744bc4cf9d03254049fcf37707763b10ddeab), [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562), [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562)]:
    -   @learncard/core@5.1.1

## 2.3.27

### Patch Changes

-   [#78](https://github.com/WeLibraryOS/LearnCard/pull/78) [`3149715`](https://github.com/WeLibraryOS/LearnCard/commit/3149715875dd007c54ca0a67b7424b025efdc558) Thanks [@goblincore](https://github.com/goblincore)! - fix: [WE-2340] Fix VC display text not showing in dark mode

## 2.3.26

### Patch Changes

-   [#76](https://github.com/WeLibraryOS/LearnCard/pull/76) [`f88e82a`](https://github.com/WeLibraryOS/LearnCard/commit/f88e82a87cd12f30105639c2339561a72aa20d7e) Thanks [@goblincore](https://github.com/goblincore)! - Fix type errors to fix build

*   [#75](https://github.com/WeLibraryOS/LearnCard/pull/75) [`2808d37`](https://github.com/WeLibraryOS/LearnCard/commit/2808d37a4889d9fafd341b472e4c7dbb68eef40a) Thanks [@goblincore](https://github.com/goblincore)! - Add Course Card, Skill Card components

## 2.3.25

### Patch Changes

-   [#74](https://github.com/WeLibraryOS/LearnCard/pull/74) [`b06f5de`](https://github.com/WeLibraryOS/LearnCard/commit/b06f5de90c8aa91aeddd9d1c92ba40044ad1461f) Thanks [@gerardopar](https://github.com/gerardopar)! - Id card

-   Updated dependencies [[`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208), [`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208), [`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208)]:
    -   @learncard/core@5.1.0

## 2.3.24

### Patch Changes

-   [#71](https://github.com/WeLibraryOS/LearnCard/pull/71) [`1b7a85a`](https://github.com/WeLibraryOS/LearnCard/commit/1b7a85aa7e61da07ed20e9297cd865b7cdd657d5) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Better Image Handling in Build Pipeline

## 2.3.23

### Patch Changes

-   [#69](https://github.com/WeLibraryOS/LearnCard/pull/69) [`a5ca571`](https://github.com/WeLibraryOS/LearnCard/commit/a5ca57166c62aea0ce40ceb2d84f8d12cad23e1e) Thanks [@goblincore](https://github.com/goblincore)! - fix build error from rollup-plugin-img and add additional img source prop to rounded card component

## 2.3.22

### Patch Changes

-   [#67](https://github.com/WeLibraryOS/LearnCard/pull/67) [`db2e9be`](https://github.com/WeLibraryOS/LearnCard/commit/db2e9beee227698e95b8da71e37046b2d0c006a9) Thanks [@goblincore](https://github.com/goblincore)! - Update wallet components with new assets

## 2.3.21

### Patch Changes

-   [#65](https://github.com/WeLibraryOS/LearnCard/pull/65) [`b413a7f`](https://github.com/WeLibraryOS/LearnCard/commit/b413a7f7147e344eb65c3ed9cd68ac08193e60b9) Thanks [@gerardopar](https://github.com/gerardopar)! - Credit card front face prop update

## 2.3.20

### Patch Changes

-   Updated dependencies [[`5c5f28b`](https://github.com/WeLibraryOS/LearnCard/commit/5c5f28b1db1a9527e56946522ea94d444a7f1eed), [`fab5557`](https://github.com/WeLibraryOS/LearnCard/commit/fab55579a1e75b438425ea019a1ac63ecb5634fe)]:
    -   @learncard/core@5.0.0

## 2.3.19

### Patch Changes

-   Updated dependencies [[`100899e`](https://github.com/WeLibraryOS/LearnCard/commit/100899e32db4385758dc1b3559da7b64f705d305)]:
    -   @learncard/core@4.1.0

## 2.3.18

### Patch Changes

-   [#53](https://github.com/WeLibraryOS/LearnCard/pull/53) [`7d40878`](https://github.com/WeLibraryOS/LearnCard/commit/7d40878f7f15d80b03701bdec859f2e7135559dd) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Use `emptyWallet` to instantiate a `LearnCard` in `VCCard`

    Previously, this component was providing dummy key material and instantiating a full-blown `LearnCard`
    object even though it only made use of verification functionality. Now, it calls `emptyWallet` and
    instantiates a much smaller `LearnCard` without needing to provide dummy key material

-   Updated dependencies [[`7d40878`](https://github.com/WeLibraryOS/LearnCard/commit/7d40878f7f15d80b03701bdec859f2e7135559dd), [`7d40878`](https://github.com/WeLibraryOS/LearnCard/commit/7d40878f7f15d80b03701bdec859f2e7135559dd)]:
    -   @learncard/core@4.0.0

## 2.3.17

### Patch Changes

-   [#55](https://github.com/WeLibraryOS/LearnCard/pull/55) [`833c348`](https://github.com/WeLibraryOS/LearnCard/commit/833c3488b28c74c865545e09d9030aed79a15d8f) Thanks [@goblincore](https://github.com/goblincore)! - Fix Safari flipipy card animation glitch

## 2.3.16

### Patch Changes

-   [#52](https://github.com/WeLibraryOS/LearnCard/pull/52) [`045428b`](https://github.com/WeLibraryOS/LearnCard/commit/045428be878dff6ba71c72ecf1205df4708f7fb1) Thanks [@goblincore](https://github.com/goblincore)! - [WE-2277] VC Display Card Update

## 2.3.15

### Patch Changes

-   [#50](https://github.com/WeLibraryOS/LearnCard/pull/50) [`9c857c5`](https://github.com/WeLibraryOS/LearnCard/commit/9c857c5457f3340bf83093e58f4578a62ac745d6) Thanks [@goblincore](https://github.com/goblincore)! - Add basic achievement display card component to react-learncard

## 2.3.14

### Patch Changes

-   Updated dependencies [[`60e0f5b`](https://github.com/WeLibraryOS/LearnCard/commit/60e0f5b6ddaeb124959e87ac61189b2638c0b32b)]:
    -   @learncard/core@3.0.0

## 2.3.13

### Patch Changes

-   [#47](https://github.com/WeLibraryOS/LearnCard/pull/47) [`b544330`](https://github.com/WeLibraryOS/LearnCard/commit/b5443302b0843c377fa5a364e3810482f391f275) Thanks [@gerardopar](https://github.com/gerardopar)! - fix: Notification polishes

## 2.3.12

### Patch Changes

-   [#42](https://github.com/WeLibraryOS/LearnCard/pull/42) [`4c6c11f`](https://github.com/WeLibraryOS/LearnCard/commit/4c6c11f30b81b103017883d7f57bd89e2f7d623e) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Bump jest to latest

-   Updated dependencies [[`4c6c11f`](https://github.com/WeLibraryOS/LearnCard/commit/4c6c11f30b81b103017883d7f57bd89e2f7d623e), [`7c09ebf`](https://github.com/WeLibraryOS/LearnCard/commit/7c09ebf0106ec207ac1aa2d7bcf1437d275328d7)]:
    -   @learncard/core@2.1.0

## 2.3.11

### Patch Changes

-   Updated dependencies [[`7adc30e`](https://github.com/WeLibraryOS/LearnCard/commit/7adc30eba700da4c6886a086d48c40b9820dc05a), [`b07187c`](https://github.com/WeLibraryOS/LearnCard/commit/b07187c4384152ec7f4c5be35a8f2b31a3aff079)]:
    -   @learncard/core@2.0.1

## 2.3.10

### Patch Changes

-   Updated dependencies [[`a131966`](https://github.com/WeLibraryOS/LearnCard/commit/a13196655378bcb51c35aaad2165b9bccac0526c)]:
    -   @learncard/core@2.0.0

## 2.3.9

### Patch Changes

-   Updated dependencies [[`4028716`](https://github.com/WeLibraryOS/LearnCard/commit/40287160de54d06f7baff000dee6f59f08f8623a)]:
    -   @learncard/core@1.5.1

## 2.3.8

### Patch Changes

-   Updated dependencies [[`de4e724`](https://github.com/WeLibraryOS/LearnCard/commit/de4e7244961f0ef91b91e6cbf32a43f29ff58b96)]:
    -   @learncard/core@1.5.0

## 2.3.7

### Patch Changes

-   Updated dependencies [[`e72b559`](https://github.com/WeLibraryOS/LearnCard/commit/e72b55994495e4bc6156b08abdd166c77fae67b7)]:
    -   @learncard/core@1.4.0

## 2.3.6

### Patch Changes

-   Updated dependencies [[`da81189`](https://github.com/WeLibraryOS/LearnCard/commit/da811895ae672f4287fbcd2026bf1aac5a6447e1)]:
    -   @learncard/core@1.3.1

## 2.3.5

### Patch Changes

-   Updated dependencies []:
    -   @learncard/core@1.3.0

## 2.3.4

### Patch Changes

-   Fix learn card - front face card component

## 2.3.3

### Patch Changes

-   Fix Learn Card - Card mobile styles

## 2.3.2

### Patch Changes

-   Learn Card Card View

## 2.3.1

### Patch Changes

-   Updated dependencies
    -   @learncard/core@1.1.5

## 2.3.0

### Minor Changes

-   Require consumers to import css

## 2.2.8

### Patch Changes

-   Fix css issues

## 2.2.7

### Patch Changes

-   Remove sideEffects array

## 2.2.6

### Patch Changes

-   Fix Notification export

## 2.2.5

### Patch Changes

-   Clean dist folder before building

## 2.2.4

### Patch Changes

-   Updated dependencies
    -   @learncard/core@1.2.0
-   Notification component
-   9ddcfab: Notification component

## 2.2.3

### Patch Changes

-   Updated dependencies
    -   @learncard/core@1.1.4

## 2.2.2

### Patch Changes

-   Fix botched release
-   Updated dependencies
    -   @learncard/core@1.1.3

## 2.2.1

### Patch Changes

-   Upgrade @learncard/types to use zod and implement types for VCs/OBv3
-   Updated dependencies
    -   @learncard/core@1.1.2

## 2.2.0

### Minor Changes

-   Fix broken exports and use esbuild instead of terser for bundling

### Patch Changes

-   Updated dependencies
    -   @learncard/core@1.1.1

## 2.1.2

### Patch Changes

-   Updated dependencies
    -   @learncard/core@1.1.0

## 2.1.1

### Patch Changes

-   Updated dependencies
    -   @learncard/core@1.0.2

## 2.1.0

### Minor Changes

-   Improve Tree-Shakeability

## 2.0.1

### Patch Changes

-   Update ReadMe
-   Updated dependencies
    -   @learncard/core@1.0.1

## 2.0.0

### Major Changes

-   Rename to @learncard/react

## 1.7.2

### Patch Changes

-   Fix Safari bug where backface is not hidden on Flippy Card

## 1.7.1

### Patch Changes

-   Add minimum time for verification loader animation
-   Updated dependencies
    -   learn-card-core@0.3.5
    -   learn-card-types@1.2.1

## 1.7.0

### Minor Changes

-   Create VCCard component

## 1.6.0

### Minor Changes

-   Verify inside of VCDisplayCard

## 1.5.1

### Patch Changes

-   Updated dependencies
    -   learn-card-core@0.3.4

## 1.5.0

### Minor Changes

-   Update Update VCDisplayCard to accept a credential

### Patch Changes

-   Updated dependencies
    -   learn-card-types@1.2.0
    -   learn-card-core@0.3.3

## 1.4.4

### Patch Changes

-   Updated dependencies
    -   learn-card-core@0.3.2

## 1.4.3

### Patch Changes

-   Updated dependencies [0a650d4]
    -   learn-card-types@1.1.0
    -   learn-card-core@0.3.1

## 1.4.2

### Patch Changes

-   Inject CSS at top of head

## 1.4.1

### Patch Changes

-   Updated dependencies
    -   learn-card-core@0.3.0

## 1.4.0

### Minor Changes

-   Actually fix exports

## 1.3.0

### Minor Changes

-   Fix deploy scripts

## 1.2.0

### Minor Changes

-   Release Learn Card Types, add stuff to react-learn-card

### Patch Changes

-   Updated dependencies
    -   learn-card-types@1.0.0

## 1.1.0

### Minor Changes

-   Release list component

## 1.0.3

### Patch Changes

-   Updated dependencies
-   Updated dependencies [b16655b]
    -   learn-card-core@0.2.1

## 1.0.2

### Patch Changes

-   Updated dependencies
    -   learn-card-core@0.2.0

## 1.0.1

### Patch Changes

-   Updated dependencies
    -   learn-card-core@0.1.1

## 1.0.0

### Major Changes

-   Initial Release

### Patch Changes

-   Updated dependencies
    -   learn-card-core@0.1.0
