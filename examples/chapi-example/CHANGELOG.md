# @learncard/chapi-example

## 1.0.64

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.2
    -   @learncard/chapi-plugin@1.0.1
    -   @learncard/react@2.6.2

## 1.0.63

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@1.0.1
    -   @learncard/react@2.6.1

## 1.0.62

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

-   Updated dependencies [[`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209)]:
    -   @learncard/init@1.0.0
    -   @learncard/chapi-plugin@1.0.0
    -   @learncard/react@2.6.0
    -   @learncard/types@5.3.0
    -   @learncard/helpers@1.0.4

## 1.0.61

### Patch Changes

-   Updated dependencies [[`2008848`](https://github.com/learningeconomy/LearnCard/commit/2008848ddfc34af0c1a92261b45ff0d7e15a0f59)]:
    -   @learncard/react@2.5.20

## 1.0.60

### Patch Changes

-   Updated dependencies [[`e081c19`](https://github.com/learningeconomy/LearnCard/commit/e081c19cb9c3d1a4ae45a7a47b120ec16287d9df)]:
    -   @learncard/react@2.5.19

## 1.0.59

### Patch Changes

-   Updated dependencies [[`74e459d`](https://github.com/learningeconomy/LearnCard/commit/74e459d0089497cbf031d18305f33fa539f2a96f)]:
    -   @learncard/react@2.5.18
    -   @learncard/core@8.5.5

## 1.0.58

### Patch Changes

-   Updated dependencies [[`4787227`](https://github.com/learningeconomy/LearnCard/commit/4787227c2e8a2b4ffa4c8b177920f80feed8a64b)]:
    -   @learncard/react@2.5.17
    -   @learncard/core@8.5.5

## 1.0.57

### Patch Changes

-   Updated dependencies [[`337e061`](https://github.com/learningeconomy/LearnCard/commit/337e061c0eef5ade2d5f7cc36f5e84e5dd4d5f12)]:
    -   @learncard/react@2.5.16

## 1.0.56

### Patch Changes

-   Updated dependencies [[`daf6eaf`](https://github.com/learningeconomy/LearnCard/commit/daf6eafd167689c995378c792a0e459632293092)]:
    -   @learncard/react@2.5.15

## 1.0.55

### Patch Changes

-   No change, just forcible version bump

-   Updated dependencies []:
    -   @learncard/core@8.5.5
    -   @learncard/helpers@1.0.3
    -   @learncard/react@2.5.14

## 1.0.54

### Patch Changes

-   Updated dependencies [[`798a22c`](https://github.com/learningeconomy/LearnCard/commit/798a22cbd296495eb365e85c7c8d1bd293ba2b34)]:
    -   @learncard/react@2.5.13

## 1.0.53

### Patch Changes

-   Updated dependencies [[`5cc4fce`](https://github.com/learningeconomy/LearnCard/commit/5cc4fce1fcdfaedf6d50e5e7e99df37ff06ae393)]:
    -   @learncard/react@2.5.12

## 1.0.52

### Patch Changes

-   Updated dependencies [[`fdbce48`](https://github.com/learningeconomy/LearnCard/commit/fdbce48c2c0a467c1ae480f6dcc4ae377de51aab)]:
    -   @learncard/react@2.5.11

## 1.0.51

### Patch Changes

-   Updated dependencies [[`f6abbd4`](https://github.com/learningeconomy/LearnCard/commit/f6abbd490e02f65d56465ec5853aa31cfd2ae40c)]:
    -   @learncard/core@8.5.4
    -   @learncard/react@2.5.10

## 1.0.50

### Patch Changes

-   Updated dependencies [[`c769bc1`](https://github.com/learningeconomy/LearnCard/commit/c769bc19d0eb7b16f11af0a70f4342f9f45ed79d)]:
    -   @learncard/react@2.5.9

## 1.0.49

### Patch Changes

-   [#249](https://github.com/learningeconomy/LearnCard/pull/249) [`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1) Thanks [@goblincore](https://github.com/goblincore)! - Republish

-   Updated dependencies [[`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1)]:
    -   @learncard/react@2.5.8
    -   @learncard/core@8.5.3
    -   @learncard/helpers@1.0.2

## 1.0.48

### Patch Changes

-   Updated dependencies [[`790bae6`](https://github.com/learningeconomy/LearnCard/commit/790bae6b844263318ec0660fa269c2a43b9d4716)]:
    -   @learncard/react@2.5.7

## 1.0.47

### Patch Changes

-   Updated dependencies [[`f1a8679`](https://github.com/learningeconomy/LearnCard/commit/f1a86796817fa20a0667a6b717b56d22038028c1)]:
    -   @learncard/core@8.5.2
    -   @learncard/react@2.5.6

## 1.0.46

### Patch Changes

-   Updated dependencies [[`4153ea0`](https://github.com/learningeconomy/LearnCard/commit/4153ea0dd3b3c562876308ba27a6060ef76ebac9)]:
    -   @learncard/react@2.5.5

## 1.0.45

### Patch Changes

-   Updated dependencies [[`f7404ea`](https://github.com/learningeconomy/LearnCard/commit/f7404ea710a09aa0b6a5f701ff3bb27bd105f5e7)]:
    -   @learncard/react@2.5.4

## 1.0.44

### Patch Changes

-   Updated dependencies [[`13d0393`](https://github.com/learningeconomy/LearnCard/commit/13d0393725d9d5e17b02de7a8088f46bda688d92), [`ed3c460`](https://github.com/learningeconomy/LearnCard/commit/ed3c460fadae88702c1244795ab3b7483d97bab7)]:
    -   @learncard/core@8.5.1
    -   @learncard/react@2.5.3

## 1.0.43

### Patch Changes

-   Updated dependencies [[`ad7f281`](https://github.com/learningeconomy/LearnCard/commit/ad7f281d6ed1fe1c33601defe71f2714f8675f45)]:
    -   @learncard/react@2.5.2

## 1.0.42

### Patch Changes

-   Updated dependencies [[`d29a2d5`](https://github.com/learningeconomy/LearnCard/commit/d29a2d5dd0d4ac1c7f178dc0d00956561012a1fb), [`2707350`](https://github.com/learningeconomy/LearnCard/commit/27073505a7e0c4f4ec8fef191fbff16d97c5d74a), [`c997138`](https://github.com/learningeconomy/LearnCard/commit/c9971386188169859bbe9e8ef7da6572432ed3f0), [`8fbee11`](https://github.com/learningeconomy/LearnCard/commit/8fbee11a07df86ba7d3fdee7430a7288b6ba321f)]:
    -   @learncard/react@2.5.1

## 1.0.41

### Patch Changes

-   Updated dependencies [[`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`df2aa4e`](https://github.com/learningeconomy/LearnCard/commit/df2aa4ef50ed45c627d2d36b73aefab47da2bcc5), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe)]:
    -   @learncard/core@8.5.0
    -   @learncard/react@2.5.0

## 1.0.40

### Patch Changes

-   Updated dependencies [[`74b7264`](https://github.com/learningeconomy/LearnCard/commit/74b72643c85d715b1f93610e8bef16c282efd3ce), [`406b9dc`](https://github.com/learningeconomy/LearnCard/commit/406b9dcb88a56395125e865672474283a15f1d03)]:
    -   @learncard/react@2.4.0

## 1.0.39

### Patch Changes

-   Updated dependencies [[`9652a2f`](https://github.com/learningeconomy/LearnCard/commit/9652a2f59bc305ed3ef4cd7d53731608f81a54c6)]:
    -   @learncard/core@8.4.2
    -   @learncard/react@2.3.69

## 1.0.38

### Patch Changes

-   Updated dependencies [[`1cb2e88`](https://github.com/learningeconomy/LearnCard/commit/1cb2e883792eba09e2adfc0e6ab386f6d6a274b2)]:
    -   @learncard/react@2.3.68

## 1.0.37

### Patch Changes

-   Updated dependencies [[`d2e5817`](https://github.com/learningeconomy/LearnCard/commit/d2e581790d63a75d304c2ace8b02133ce122c7ce)]:
    -   @learncard/core@8.4.1
    -   @learncard/react@2.3.67

## 1.0.36

### Patch Changes

-   Updated dependencies [[`e78c77d`](https://github.com/learningeconomy/LearnCard/commit/e78c77dc8dfa6c69d7163ed49b551bd739de2f09)]:
    -   @learncard/core@8.4.0
    -   @learncard/react@2.3.66

## 1.0.35

### Patch Changes

-   Updated dependencies [[`d6ebc5b`](https://github.com/learningeconomy/LearnCard/commit/d6ebc5baa52eab591398e81267adb40b3dce74f3)]:
    -   @learncard/core@8.3.1
    -   @learncard/react@2.3.65

## 1.0.34

### Patch Changes

-   Updated dependencies [[`d817fde`](https://github.com/learningeconomy/LearnCard/commit/d817fdecfc98023b3907451750338561df9d577c)]:
    -   @learncard/core@8.3.0
    -   @learncard/react@2.3.64

## 1.0.33

### Patch Changes

-   Updated dependencies [[`ace9b60`](https://github.com/learningeconomy/LearnCard/commit/ace9b60b02932e36090e7392a1b7b6a13a9593b8)]:
    -   @learncard/core@8.2.0
    -   @learncard/react@2.3.63

## 1.0.32

### Patch Changes

-   Updated dependencies [[`42d02db`](https://github.com/learningeconomy/LearnCard/commit/42d02dba24129983664aceb7da5aaeb4039f8b04)]:
    -   @learncard/core@8.1.1
    -   @learncard/react@2.3.62

## 1.0.31

### Patch Changes

-   Updated dependencies [[`36e938b`](https://github.com/learningeconomy/LearnCard/commit/36e938b1211b53b96962663e8b33b50f24b2ca51), [`36e938b`](https://github.com/learningeconomy/LearnCard/commit/36e938b1211b53b96962663e8b33b50f24b2ca51)]:
    -   @learncard/core@8.1.0
    -   @learncard/react@2.3.61

## 1.0.30

### Patch Changes

-   Updated dependencies [[`31b67a5`](https://github.com/learningeconomy/LearnCard/commit/31b67a5d6010ce3886406677a0aa838b778d64f8)]:
    -   @learncard/react@2.3.60

## 1.0.29

### Patch Changes

-   Updated dependencies [[`f545ed4`](https://github.com/learningeconomy/LearnCard/commit/f545ed434dd23179591e3b7c0bd82bd9c2ae2fb2)]:
    -   @learncard/react@2.3.59

## 1.0.28

### Patch Changes

-   Updated dependencies [[`bc746a0`](https://github.com/learningeconomy/LearnCard/commit/bc746a05fa6c4196e432fac20b5783221b59be65), [`c388fd4`](https://github.com/learningeconomy/LearnCard/commit/c388fd49f2832cadcb201779de17d45d3fe7b660)]:
    -   @learncard/react@2.3.58
    -   @learncard/core@8.0.7

## 1.0.27

### Patch Changes

-   Updated dependencies [[`b3ae77e`](https://github.com/learningeconomy/LearnCard/commit/b3ae77ef20a10dee303a2c8318faa8bf28344215)]:
    -   @learncard/core@8.0.6
    -   @learncard/react@2.3.57

## 1.0.26

### Patch Changes

-   Updated dependencies [[`a3aafb3`](https://github.com/learningeconomy/LearnCard/commit/a3aafb39db6fccae19e999fb4fc89a588bc14555)]:
    -   @learncard/core@8.0.5
    -   @learncard/react@2.3.56

## 1.0.25

### Patch Changes

-   Updated dependencies [[`86f3541`](https://github.com/learningeconomy/LearnCard/commit/86f35413e6006a17a596d71ea3f186f915e90f28)]:
    -   @learncard/core@8.0.4
    -   @learncard/react@2.3.55

## 1.0.24

### Patch Changes

-   Updated dependencies [[`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3), [`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3)]:
    -   @learncard/helpers@1.0.1
    -   @learncard/core@8.0.3
    -   @learncard/react@2.3.54

## 1.0.23

### Patch Changes

-   Updated dependencies [[`7c6945c`](https://github.com/learningeconomy/LearnCard/commit/7c6945cfe4be8574c869c2515f7806123c372765)]:
    -   @learncard/core@8.0.2
    -   @learncard/react@2.3.53

## 1.0.22

### Patch Changes

-   Updated dependencies [[`88df9f8`](https://github.com/learningeconomy/LearnCard/commit/88df9f8c34f2d258845a62c3a214e9a382796f1e), [`88df9f8`](https://github.com/learningeconomy/LearnCard/commit/88df9f8c34f2d258845a62c3a214e9a382796f1e)]:
    -   @learncard/react@2.3.52

## 1.0.21

### Patch Changes

-   Updated dependencies [[`abec576`](https://github.com/learningeconomy/LearnCard/commit/abec576ab55bd9874d487e6ae13b5976a7d52c4e), [`1cafab4`](https://github.com/learningeconomy/LearnCard/commit/1cafab43a6c053914305e0a8b938748ed2a5fd31), [`2851dcd`](https://github.com/learningeconomy/LearnCard/commit/2851dcd70129a4e84b78c62bbd2de05d871edd76)]:
    -   @learncard/react@2.3.51
    -   @learncard/core@8.0.1

## 1.0.20

### Patch Changes

-   Updated dependencies [[`b9bab6e`](https://github.com/learningeconomy/LearnCard/commit/b9bab6ec68db49ffda5163811a61211811f0b0fe)]:
    -   @learncard/react@2.3.50

## 1.0.19

### Patch Changes

-   Updated dependencies [[`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9), [`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9)]:
    -   @learncard/core@8.0.0
    -   @learncard/react@2.3.49

## 1.0.18

### Patch Changes

-   Updated dependencies [[`b655513`](https://github.com/learningeconomy/LearnCard/commit/b6555139a5fcf653db514d8ee059bd9edd99fd54)]:
    -   @learncard/react@2.3.48

## 1.0.17

### Patch Changes

-   Updated dependencies [[`235c773`](https://github.com/learningeconomy/LearnCard/commit/235c7731aded77985cf9083c09c6200ff8599766)]:
    -   @learncard/react@2.3.47

## 1.0.16

### Patch Changes

-   Updated dependencies [[`f12e6b0`](https://github.com/learningeconomy/LearnCard/commit/f12e6b03b078ef5861a657de52f48fb28eb2660e)]:
    -   @learncard/react@2.3.46

## 1.0.15

### Patch Changes

-   Updated dependencies [[`dd4931f`](https://github.com/learningeconomy/LearnCard/commit/dd4931f9e439c4f80b16c6f438aff3e4eee6b8af)]:
    -   @learncard/react@2.3.45

## 1.0.14

### Patch Changes

-   Updated dependencies [[`e67119e`](https://github.com/learningeconomy/LearnCard/commit/e67119e978d4df324aa71235c3b202b3e8bdde7c)]:
    -   @learncard/react@2.3.44

## 1.0.13

### Patch Changes

-   Updated dependencies [[`2a4f635`](https://github.com/learningeconomy/LearnCard/commit/2a4f63521b2ce68961868359873064a25394dd99)]:
    -   @learncard/core@7.0.3
    -   @learncard/react@2.3.43

## 1.0.12

### Patch Changes

-   Updated dependencies [[`00b119a`](https://github.com/learningeconomy/LearnCard/commit/00b119a56769bcdc921502a5ad0591d07ad667e8)]:
    -   @learncard/core@7.0.2
    -   @learncard/react@2.3.42

## 1.0.11

### Patch Changes

-   Updated dependencies [[`7f98a90`](https://github.com/learningeconomy/LearnCard/commit/7f98a90df1e3ee8c2d39cabc754c6655e6072aa0)]:
    -   @learncard/react@2.3.41

## 1.0.10

### Patch Changes

-   Updated dependencies [[`e8f1ba3`](https://github.com/learningeconomy/LearnCard/commit/e8f1ba3594bc749caf18959962da4b85c97db4a6)]:
    -   @learncard/core@7.0.1
    -   @learncard/react@2.3.40

## 1.0.9

### Patch Changes

-   Updated dependencies [[`25349fe`](https://github.com/learningeconomy/LearnCard/commit/25349fe064c751a004092bcab24e1674fadfd5fe)]:
    -   @learncard/core@7.0.0
    -   @learncard/react@2.3.39

## 1.0.8

### Patch Changes

-   Updated dependencies [[`27e4ecd`](https://github.com/learningeconomy/LearnCard/commit/27e4ecd6641cf16b97d198434250f55135d09e97), [`8843fda`](https://github.com/learningeconomy/LearnCard/commit/8843fda579ffb9b8adbb4d467143207e20dfe305)]:
    -   @learncard/core@6.4.0
    -   @learncard/react@2.3.38

## 1.0.7

### Patch Changes

-   Updated dependencies [[`e085abd`](https://github.com/learningeconomy/LearnCard/commit/e085abd72d3b4c085cdfc5c623864b40e35cf302)]:
    -   @learncard/core@6.3.1
    -   @learncard/react@2.3.37

## 1.0.6

### Patch Changes

-   Updated dependencies [[`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0)]:
    -   @learncard/core@6.3.0
    -   @learncard/react@2.3.36

## 1.0.5

### Patch Changes

-   Updated dependencies [[`08c1c30`](https://github.com/learningeconomy/LearnCard/commit/08c1c30e24a65853c0e04ae1c775d79cd55628e1)]:
    -   @learncard/react@2.3.35

## 1.0.4

### Patch Changes

-   Updated dependencies [[`d85b8dc`](https://github.com/learningeconomy/LearnCard/commit/d85b8dce25482d7acff7b0629da53e51a09dcc9e), [`d85b8dc`](https://github.com/learningeconomy/LearnCard/commit/d85b8dce25482d7acff7b0629da53e51a09dcc9e)]:
    -   @learncard/react@2.3.34

## 1.0.3

### Patch Changes

-   Updated dependencies [[`426702f`](https://github.com/learningeconomy/LearnCard/commit/426702f50b8790a8eeb68908331a79c79043f4f5)]:
    -   @learncard/react@2.3.33

## 1.0.2

### Patch Changes

-   Updated dependencies [[`4e5cc2f`](https://github.com/learningeconomy/LearnCard/commit/4e5cc2fe935f99ca663bc9b7d75db2a86c0b7b23)]:
    -   @learncard/react@2.3.32

## 1.0.1

### Patch Changes

-   Updated dependencies [[`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342)]:
    -   @learncard/core@6.2.0
    -   @learncard/helpers@1.0.0
    -   @learncard/react@2.3.31
