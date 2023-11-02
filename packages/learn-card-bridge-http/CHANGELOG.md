# @learncard/create-http-bridge

## 1.1.68

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.2.5

## 1.1.67

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.2.4

## 1.1.66

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.2.3

## 1.1.65

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.2.2

## 1.1.64

### Patch Changes

-   Updated dependencies [[`56aef2d`](https://github.com/learningeconomy/LearnCard/commit/56aef2d7830a5c66fa3b569b3c25eb3ecb6cc465)]:
    -   @learncard/types@5.3.3
    -   @learncard/init@1.2.1

## 1.1.63

### Patch Changes

-   Updated dependencies [[`867d38c`](https://github.com/learningeconomy/LearnCard/commit/867d38c5f606ff73fa328a4616a8a58a8f49d0f0)]:
    -   @learncard/init@1.2.0

## 1.1.62

### Patch Changes

-   Updated dependencies [[`1c4e09d`](https://github.com/learningeconomy/LearnCard/commit/1c4e09d136464286959000e5ed14cdf59dba9196)]:
    -   @learncard/init@1.1.0

## 1.1.61

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.23

## 1.1.60

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.22

## 1.1.59

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.21

## 1.1.58

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.20

## 1.1.57

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.19

## 1.1.56

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.18

## 1.1.55

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.17

## 1.1.54

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.16

## 1.1.53

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.15

## 1.1.52

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.14

## 1.1.51

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.13

## 1.1.50

### Patch Changes

-   Updated dependencies [[`630fdcf`](https://github.com/learningeconomy/LearnCard/commit/630fdcf0f55dbef6693f21a32fcefe541e5ec9e6)]:
    -   @learncard/init@1.0.12

## 1.1.49

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.11

## 1.1.48

### Patch Changes

-   [#334](https://github.com/learningeconomy/LearnCard/pull/334) [`a4e4800`](https://github.com/learningeconomy/LearnCard/commit/a4e4800d05ead0336a0e9fb0140ffe2f63d847da) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add CLR context (https://www.imsglobal.org/spec/clr/v2p0)

-   Updated dependencies []:
    -   @learncard/init@1.0.10

## 1.1.47

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.9

## 1.1.46

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.8

## 1.1.45

### Patch Changes

-   Updated dependencies [[`a0b62f3`](https://github.com/learningeconomy/LearnCard/commit/a0b62f351d32c4e0a788b519dd852aa5df9e6c8a), [`a0b62f3`](https://github.com/learningeconomy/LearnCard/commit/a0b62f351d32c4e0a788b519dd852aa5df9e6c8a)]:
    -   @learncard/types@5.3.2
    -   @learncard/init@1.0.7

## 1.1.44

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.6

## 1.1.43

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.5

## 1.1.42

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.4

## 1.1.41

### Patch Changes

-   Updated dependencies [[`23b48d7`](https://github.com/learningeconomy/LearnCard/commit/23b48d7b8221e6191d089735f13d925f69d3c800)]:
    -   @learncard/types@5.3.1
    -   @learncard/init@1.0.3

## 1.1.40

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.2

## 1.1.39

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.1

## 1.1.38

### Patch Changes

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

-   Updated dependencies [[`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209)]:
    -   @learncard/init@1.0.0
    -   @learncard/types@5.3.0

## 1.1.37

### Patch Changes

-   [`74e459d`](https://github.com/learningeconomy/LearnCard/commit/74e459d0089497cbf031d18305f33fa539f2a96f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Empty version bump

-   Updated dependencies [[`74e459d`](https://github.com/learningeconomy/LearnCard/commit/74e459d0089497cbf031d18305f33fa539f2a96f)]:
    -   @learncard/types@5.2.9
    -   @learncard/core@8.5.5

## 1.1.36

### Patch Changes

-   Updated dependencies [[`4787227`](https://github.com/learningeconomy/LearnCard/commit/4787227c2e8a2b4ffa4c8b177920f80feed8a64b)]:
    -   @learncard/types@5.2.8
    -   @learncard/core@8.5.5

## 1.1.35

### Patch Changes

-   No change, just forcible version bump

-   Updated dependencies []:
    -   @learncard/core@8.5.5
    -   @learncard/types@5.2.7

## 1.1.34

### Patch Changes

-   Updated dependencies [[`82289ba`](https://github.com/learningeconomy/LearnCard/commit/82289bacb997880ae25eaf833afe5c9e4ad68c37)]:
    -   @learncard/types@5.2.6
    -   @learncard/core@8.5.4

## 1.1.33

### Patch Changes

-   Updated dependencies [[`37133bf`](https://github.com/learningeconomy/LearnCard/commit/37133bf375a883c8086ba837c2155a609dea1912)]:
    -   @learncard/types@5.2.5
    -   @learncard/core@8.5.4

## 1.1.32

### Patch Changes

-   Updated dependencies [[`f6abbd4`](https://github.com/learningeconomy/LearnCard/commit/f6abbd490e02f65d56465ec5853aa31cfd2ae40c)]:
    -   @learncard/core@8.5.4
    -   @learncard/types@5.2.4

## 1.1.31

### Patch Changes

-   [#249](https://github.com/learningeconomy/LearnCard/pull/249) [`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1) Thanks [@goblincore](https://github.com/goblincore)! - Republish

-   Updated dependencies [[`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1)]:
    -   @learncard/core@8.5.3
    -   @learncard/types@5.2.3

## 1.1.30

### Patch Changes

-   Updated dependencies [[`f1a8679`](https://github.com/learningeconomy/LearnCard/commit/f1a86796817fa20a0667a6b717b56d22038028c1)]:
    -   @learncard/core@8.5.2

## 1.1.29

### Patch Changes

-   Updated dependencies [[`e69af5a`](https://github.com/learningeconomy/LearnCard/commit/e69af5ab09b88d111ddf207f413552aa0bac991a)]:
    -   @learncard/types@5.2.2
    -   @learncard/core@8.5.1

## 1.1.28

### Patch Changes

-   Updated dependencies [[`13d0393`](https://github.com/learningeconomy/LearnCard/commit/13d0393725d9d5e17b02de7a8088f46bda688d92), [`ed3c460`](https://github.com/learningeconomy/LearnCard/commit/ed3c460fadae88702c1244795ab3b7483d97bab7)]:
    -   @learncard/core@8.5.1
    -   @learncard/types@5.2.1

## 1.1.27

### Patch Changes

-   Updated dependencies [[`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe)]:
    -   @learncard/core@8.5.0
    -   @learncard/types@5.2.0

## 1.1.26

### Patch Changes

-   Updated dependencies [[`9652a2f`](https://github.com/learningeconomy/LearnCard/commit/9652a2f59bc305ed3ef4cd7d53731608f81a54c6)]:
    -   @learncard/core@8.4.2

## 1.1.25

### Patch Changes

-   Updated dependencies [[`d2e5817`](https://github.com/learningeconomy/LearnCard/commit/d2e581790d63a75d304c2ace8b02133ce122c7ce)]:
    -   @learncard/core@8.4.1

## 1.1.24

### Patch Changes

-   Updated dependencies [[`e78c77d`](https://github.com/learningeconomy/LearnCard/commit/e78c77dc8dfa6c69d7163ed49b551bd739de2f09)]:
    -   @learncard/core@8.4.0

## 1.1.23

### Patch Changes

-   Updated dependencies [[`d6ebc5b`](https://github.com/learningeconomy/LearnCard/commit/d6ebc5baa52eab591398e81267adb40b3dce74f3)]:
    -   @learncard/core@8.3.1

## 1.1.22

### Patch Changes

-   Updated dependencies [[`9aeb9f1`](https://github.com/learningeconomy/LearnCard/commit/9aeb9f1c175fd5ab7f2b94addaa9132bcc9cb4cf)]:
    -   @learncard/types@5.1.1
    -   @learncard/core@8.3.0

## 1.1.21

### Patch Changes

-   Updated dependencies [[`d817fde`](https://github.com/learningeconomy/LearnCard/commit/d817fdecfc98023b3907451750338561df9d577c)]:
    -   @learncard/core@8.3.0

## 1.1.20

### Patch Changes

-   Updated dependencies [[`ace9b60`](https://github.com/learningeconomy/LearnCard/commit/ace9b60b02932e36090e7392a1b7b6a13a9593b8)]:
    -   @learncard/core@8.2.0

## 1.1.19

### Patch Changes

-   Updated dependencies [[`42d02db`](https://github.com/learningeconomy/LearnCard/commit/42d02dba24129983664aceb7da5aaeb4039f8b04)]:
    -   @learncard/core@8.1.1

## 1.1.18

### Patch Changes

-   Updated dependencies [[`36e938b`](https://github.com/learningeconomy/LearnCard/commit/36e938b1211b53b96962663e8b33b50f24b2ca51), [`36e938b`](https://github.com/learningeconomy/LearnCard/commit/36e938b1211b53b96962663e8b33b50f24b2ca51)]:
    -   @learncard/core@8.1.0

## 1.1.17

### Patch Changes

-   Updated dependencies [[`c388fd4`](https://github.com/learningeconomy/LearnCard/commit/c388fd49f2832cadcb201779de17d45d3fe7b660)]:
    -   @learncard/core@8.0.7

## 1.1.16

### Patch Changes

-   Updated dependencies [[`b3ae77e`](https://github.com/learningeconomy/LearnCard/commit/b3ae77ef20a10dee303a2c8318faa8bf28344215)]:
    -   @learncard/core@8.0.6

## 1.1.15

### Patch Changes

-   Updated dependencies [[`a3aafb3`](https://github.com/learningeconomy/LearnCard/commit/a3aafb39db6fccae19e999fb4fc89a588bc14555)]:
    -   @learncard/core@8.0.5

## 1.1.14

### Patch Changes

-   Updated dependencies [[`86f3541`](https://github.com/learningeconomy/LearnCard/commit/86f35413e6006a17a596d71ea3f186f915e90f28)]:
    -   @learncard/core@8.0.4

## 1.1.13

### Patch Changes

-   Updated dependencies [[`982bd41`](https://github.com/learningeconomy/LearnCard/commit/982bd4151d485ec6977c0bf774fe1cf243b8db74)]:
    -   @learncard/types@5.1.0
    -   @learncard/core@8.0.3

## 1.1.12

### Patch Changes

-   Updated dependencies [[`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3), [`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3)]:
    -   @learncard/types@5.0.1
    -   @learncard/core@8.0.3

## 1.1.11

### Patch Changes

-   Updated dependencies [[`7c6945c`](https://github.com/learningeconomy/LearnCard/commit/7c6945cfe4be8574c869c2515f7806123c372765)]:
    -   @learncard/core@8.0.2

## 1.1.10

### Patch Changes

-   Updated dependencies [[`1cafab4`](https://github.com/learningeconomy/LearnCard/commit/1cafab43a6c053914305e0a8b938748ed2a5fd31)]:
    -   @learncard/core@8.0.1

## 1.1.9

### Patch Changes

-   Updated dependencies [[`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9), [`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9), [`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9)]:
    -   @learncard/core@8.0.0
    -   @learncard/types@5.0.0

## 1.1.8

### Patch Changes

-   Updated dependencies [[`2a4f635`](https://github.com/learningeconomy/LearnCard/commit/2a4f63521b2ce68961868359873064a25394dd99)]:
    -   @learncard/core@7.0.3

## 1.1.7

### Patch Changes

-   Updated dependencies [[`00b119a`](https://github.com/learningeconomy/LearnCard/commit/00b119a56769bcdc921502a5ad0591d07ad667e8)]:
    -   @learncard/core@7.0.2

## 1.1.6

### Patch Changes

-   Updated dependencies [[`e8f1ba3`](https://github.com/learningeconomy/LearnCard/commit/e8f1ba3594bc749caf18959962da4b85c97db4a6)]:
    -   @learncard/core@7.0.1

## 1.1.5

### Patch Changes

-   Updated dependencies [[`efab28a`](https://github.com/learningeconomy/LearnCard/commit/efab28ae5c9487239537d220316f5a216d64fe58)]:
    -   @learncard/types@4.0.1
    -   @learncard/core@7.0.0

## 1.1.4

### Patch Changes

-   Updated dependencies [[`25349fe`](https://github.com/learningeconomy/LearnCard/commit/25349fe064c751a004092bcab24e1674fadfd5fe), [`25349fe`](https://github.com/learningeconomy/LearnCard/commit/25349fe064c751a004092bcab24e1674fadfd5fe)]:
    -   @learncard/types@4.0.0
    -   @learncard/core@7.0.0

## 1.1.3

### Patch Changes

-   Updated dependencies [[`27e4ecd`](https://github.com/learningeconomy/LearnCard/commit/27e4ecd6641cf16b97d198434250f55135d09e97), [`27e4ecd`](https://github.com/learningeconomy/LearnCard/commit/27e4ecd6641cf16b97d198434250f55135d09e97)]:
    -   @learncard/core@6.4.0
    -   @learncard/types@3.1.0

## 1.1.2

### Patch Changes

-   Updated dependencies [[`d3e542d`](https://github.com/learningeconomy/LearnCard/commit/d3e542d412eb20644b2d14efa3d728cecdf53adc)]:
    -   @learncard/types@3.0.2
    -   @learncard/core@6.3.1

## 1.1.1

### Patch Changes

-   Updated dependencies [[`e085abd`](https://github.com/learningeconomy/LearnCard/commit/e085abd72d3b4c085cdfc5c623864b40e35cf302)]:
    -   @learncard/core@6.3.1

## 1.1.0

### Minor Changes

-   [#100](https://github.com/learningeconomy/LearnCard/pull/100) [`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add /did and /presentations/issue non-standard routes

### Patch Changes

-   Updated dependencies [[`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0), [`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0)]:
    -   @learncard/types@3.0.1
    -   @learncard/core@6.3.0

## 1.0.18

### Patch Changes

-   Updated dependencies [[`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342)]:
    -   @learncard/core@6.2.0

## 1.0.17

### Patch Changes

-   Updated dependencies [[`c1befdc`](https://github.com/learningeconomy/LearnCard/commit/c1befdc8a30d3cc111d938c530493b1a5b87aa00), [`c1befdc`](https://github.com/learningeconomy/LearnCard/commit/c1befdc8a30d3cc111d938c530493b1a5b87aa00)]:
    -   @learncard/core@6.1.0
    -   @learncard/types@3.0.0

## 1.0.16

### Patch Changes

-   [#82](https://github.com/learningeconomy/LearnCard/pull/82) [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update ReadMe

-   Updated dependencies [[`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104), [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104), [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104)]:
    -   @learncard/core@6.0.0
    -   @learncard/types@2.2.1

## 1.0.15

### Patch Changes

-   Updated dependencies [[`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562), [`074989f`](https://github.com/learningeconomy/LearnCard/commit/074989f2eb4b7d8cb9b2d6a62451cdcf047d72d5), [`120744b`](https://github.com/learningeconomy/LearnCard/commit/120744bc4cf9d03254049fcf37707763b10ddeab), [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562), [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562)]:
    -   @learncard/core@5.1.1
    -   @learncard/types@2.2.0

## 1.0.14

### Patch Changes

-   Updated dependencies [[`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208), [`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208), [`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208)]:
    -   @learncard/core@5.1.0

## 1.0.13

### Patch Changes

-   Updated dependencies [[`5c5f28b`](https://github.com/WeLibraryOS/LearnCard/commit/5c5f28b1db1a9527e56946522ea94d444a7f1eed), [`fab5557`](https://github.com/WeLibraryOS/LearnCard/commit/fab55579a1e75b438425ea019a1ac63ecb5634fe)]:
    -   @learncard/core@5.0.0

## 1.0.12

### Patch Changes

-   Updated dependencies [[`100899e`](https://github.com/WeLibraryOS/LearnCard/commit/100899e32db4385758dc1b3559da7b64f705d305)]:
    -   @learncard/core@4.1.0

## 1.0.11

### Patch Changes

-   Updated dependencies [[`7d40878`](https://github.com/WeLibraryOS/LearnCard/commit/7d40878f7f15d80b03701bdec859f2e7135559dd), [`7d40878`](https://github.com/WeLibraryOS/LearnCard/commit/7d40878f7f15d80b03701bdec859f2e7135559dd)]:
    -   @learncard/core@4.0.0

## 1.0.10

### Patch Changes

-   Updated dependencies [[`60e0f5b`](https://github.com/WeLibraryOS/LearnCard/commit/60e0f5b6ddaeb124959e87ac61189b2638c0b32b)]:
    -   @learncard/core@3.0.0

## 1.0.9

### Patch Changes

-   Updated dependencies [[`4c6c11f`](https://github.com/WeLibraryOS/LearnCard/commit/4c6c11f30b81b103017883d7f57bd89e2f7d623e), [`7c09ebf`](https://github.com/WeLibraryOS/LearnCard/commit/7c09ebf0106ec207ac1aa2d7bcf1437d275328d7)]:
    -   @learncard/core@2.1.0

## 1.0.8

### Patch Changes

-   Updated dependencies [[`7adc30e`](https://github.com/WeLibraryOS/LearnCard/commit/7adc30eba700da4c6886a086d48c40b9820dc05a), [`b07187c`](https://github.com/WeLibraryOS/LearnCard/commit/b07187c4384152ec7f4c5be35a8f2b31a3aff079)]:
    -   @learncard/core@2.0.1

## 1.0.7

### Patch Changes

-   Updated dependencies [[`a131966`](https://github.com/WeLibraryOS/LearnCard/commit/a13196655378bcb51c35aaad2165b9bccac0526c)]:
    -   @learncard/core@2.0.0

## 1.0.6

### Patch Changes

-   Updated dependencies [[`4028716`](https://github.com/WeLibraryOS/LearnCard/commit/40287160de54d06f7baff000dee6f59f08f8623a)]:
    -   @learncard/core@1.5.1

## 1.0.5

### Patch Changes

-   Updated dependencies [[`de4e724`](https://github.com/WeLibraryOS/LearnCard/commit/de4e7244961f0ef91b91e6cbf32a43f29ff58b96)]:
    -   @learncard/core@1.5.0

## 1.0.4

### Patch Changes

-   Updated dependencies [[`e72b559`](https://github.com/WeLibraryOS/LearnCard/commit/e72b55994495e4bc6156b08abdd166c77fae67b7)]:
    -   @learncard/core@1.4.0

## 1.0.3

### Patch Changes

-   Updated dependencies [[`da81189`](https://github.com/WeLibraryOS/LearnCard/commit/da811895ae672f4287fbcd2026bf1aac5a6447e1)]:
    -   @learncard/core@1.3.1

## 1.0.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/core@1.3.0

## 1.0.1

### Patch Changes

-   Updated dependencies
    -   @learncard/core@1.2.0
    -   @learncard/types@2.1.2
