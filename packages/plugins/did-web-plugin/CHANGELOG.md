# did-web-plugin

## 1.0.3

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

-   Updated dependencies [[`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209)]:
    -   @learncard/ceramic-plugin@1.0.0
    -   @learncard/didkey-plugin@1.0.0
    -   @learncard/didkit-plugin@1.0.0
    -   @learncard/expiration-plugin@1.0.0
    -   @learncard/learn-card-plugin@1.0.0
    -   @learncard/vc-plugin@1.0.0
    -   @learncard/vc-templates-plugin@1.0.0
    -   @learncard/core@9.0.0
    -   @learncard/types@5.3.0
    -   @learncard/helpers@1.0.4

## 1.0.2

### Patch Changes

-   No change, just forcible version bump

-   Updated dependencies []:
    -   @learncard/core@8.5.5
