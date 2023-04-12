# docs

## 0.1.1

### Patch Changes

-   No change, just forcible version bump

## 0.1.0

### Minor Changes

-   [#232](https://github.com/learningeconomy/LearnCard/pull/232) [`3606fec`](https://github.com/learningeconomy/LearnCard/commit/3606fec4c226828e51a3df6eb780e420935ebc94) Thanks [@wthomasmiii](https://github.com/wthomasmiii)! - Addition of push notification configs for hitting an http webhook

    ## What is being done

    On the backend learn-card-network we have done the following

    1. Added 2 new endpoints to the lambda service, one for registering, and one for unregistering
    2. Added both functions to the learncard Network plugin, hitting the tRPC client
    3. Triggerable push notifications are included with functions now, initalizing a class, then using its subfunctionality.

    ## Why this was done

    Was made to include hitting webhooks, that process notification sending.

## 0.0.1

### Patch Changes

-   [#170](https://github.com/learningeconomy/LearnCard/pull/170) [`c388fd4`](https://github.com/learningeconomy/LearnCard/commit/c388fd49f2832cadcb201779de17d45d3fe7b660) Thanks [@Custard7](https://github.com/Custard7)! - Fix: Update READMEs to 8.0 syntax
