# @learncard/credential-library

## 1.0.14

### Patch Changes

-   Updated dependencies [[`660778e73161c9c185e1f6592a5ac90dd9309a0a`](https://github.com/learningeconomy/LearnCard/commit/660778e73161c9c185e1f6592a5ac90dd9309a0a), [`acf13250d6ffd39798b44f0c5b9331b3769ebd24`](https://github.com/learningeconomy/LearnCard/commit/acf13250d6ffd39798b44f0c5b9331b3769ebd24), [`f504c57823d2a978f9cec569a00c9478ea8b3158`](https://github.com/learningeconomy/LearnCard/commit/f504c57823d2a978f9cec569a00c9478ea8b3158)]:
    -   @learncard/types@5.18.0

## 1.0.13

### Patch Changes

-   Updated dependencies [[`c0b5edb671ba3704b44547f9d0ef99f6f0e090ba`](https://github.com/learningeconomy/LearnCard/commit/c0b5edb671ba3704b44547f9d0ef99f6f0e090ba)]:
    -   @learncard/types@5.17.6

## 1.0.12

### Patch Changes

-   [`9b1f8352946f78f382f85d95c5e983d86449ea68`](https://github.com/learningeconomy/LearnCard/commit/9b1f8352946f78f382f85d95c5e983d86449ea68) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Republish package metadata with concrete internal dependency versions instead of workspace protocol ranges.

## 1.0.11

### Patch Changes

-   [#1303](https://github.com/learningeconomy/LearnCard/pull/1303) [`59d79e9c2aed145284d6cc3de4c53ef0d3415299`](https://github.com/learningeconomy/LearnCard/commit/59d79e9c2aed145284d6cc3de4c53ef0d3415299) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Switch workspace development to Bun source-mode resolution while preserving package build outputs for npm publishing.

-   Updated dependencies [[`59d79e9c2aed145284d6cc3de4c53ef0d3415299`](https://github.com/learningeconomy/LearnCard/commit/59d79e9c2aed145284d6cc3de4c53ef0d3415299), [`8bcccce23f919e9bcd0d22d87e7d33242b557930`](https://github.com/learningeconomy/LearnCard/commit/8bcccce23f919e9bcd0d22d87e7d33242b557930), [`8bcccce23f919e9bcd0d22d87e7d33242b557930`](https://github.com/learningeconomy/LearnCard/commit/8bcccce23f919e9bcd0d22d87e7d33242b557930)]:
    -   @learncard/types@5.17.5

## 1.0.10

### Patch Changes

-   [#1325](https://github.com/learningeconomy/LearnCard/pull/1325) [`6bebc466925987b23008b0de2229db554035a87e`](https://github.com/learningeconomy/LearnCard/commit/6bebc466925987b23008b0de2229db554035a87e) Thanks [@smurflo2](https://github.com/smurflo2)! - Zod v4

-   Updated dependencies [[`7a60dec7c32d19b2a3120b949eadc5770926f354`](https://github.com/learningeconomy/LearnCard/commit/7a60dec7c32d19b2a3120b949eadc5770926f354), [`6bebc466925987b23008b0de2229db554035a87e`](https://github.com/learningeconomy/LearnCard/commit/6bebc466925987b23008b0de2229db554035a87e)]:
    -   @learncard/types@5.17.4

## 1.0.9

### Patch Changes

-   Updated dependencies [[`05fc8f650d9e3348232ddc5517a5c39e94b4f52f`](https://github.com/learningeconomy/LearnCard/commit/05fc8f650d9e3348232ddc5517a5c39e94b4f52f)]:
    -   @learncard/types@5.17.3

## 1.0.8

### Patch Changes

-   Updated dependencies [[`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083), [`c749d55bec0fed881c3e488ffd90744e2eee021e`](https://github.com/learningeconomy/LearnCard/commit/c749d55bec0fed881c3e488ffd90744e2eee021e), [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083)]:
    -   @learncard/types@5.17.2

## 1.0.7

### Patch Changes

-   Updated dependencies [[`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2)]:
    -   @learncard/types@5.17.1

## 1.0.6

### Patch Changes

-   Updated dependencies [[`7e90089f517908562becf72eb3831e9208232278`](https://github.com/learningeconomy/LearnCard/commit/7e90089f517908562becf72eb3831e9208232278), [`406f5f64ff49aaecbf8cb499a7f6b294c7105cc3`](https://github.com/learningeconomy/LearnCard/commit/406f5f64ff49aaecbf8cb499a7f6b294c7105cc3)]:
    -   @learncard/types@5.17.0

## 1.0.5

### Patch Changes

-   [#1240](https://github.com/learningeconomy/LearnCard/pull/1240) [`3a05603c72d76020b43ec6bbd5e31b2b31c0fd2b`](https://github.com/learningeconomy/LearnCard/commit/3a05603c72d76020b43ec6bbd5e31b2b31c0fd2b) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: [LC-1812][LC-1855] - Add Render Method Plugin + Render Method Toggle

    Adds `@learncard/render-method-plugin` for attaching and reading W3C `renderMethod` entries on Verifiable Credentials. The plugin is registered as part of the default LearnCard wallet stack.

    **Write side** (`wallet.invoke`): `attachRenderMethod`, `buildTemplateRenderMethod`.

    **Read side** (`wallet.invoke` and direct imports):

    -   String-based sugar (most common case): `findTemplateRenderMethod(vc, suite | suites[])`, `findTemplateRenderMethods(vc, suite | suites[])`.
    -   Backward-compatible alias: `getSvgMustacheRenderMethod`.
    -   Predicate-based escape hatch: `findRenderMethod`, `findRenderMethods`.
    -   Raw access: `getRenderMethods` (unwraps `CertifiedBoostCredential`, normalizes object↔array).
    -   Data shaping: `buildRenderData(vc, renderProperty?)` (Mustache context with `vc` / `credential` / `credentialSubjects` aliases, RFC 6901 overlay).
    -   Exported type guards: `isTemplateRenderMethod`, `isSvgMustacheRenderMethod`.

    The pure data-shaping helpers (Mustache context, JSON Pointer overlay, boost unwrapping) moved out of `apps/learn-card-app/src/helpers/renderMethod.helpers.ts` into the plugin; the app now only owns the SVG-specific render pipeline (Mustache hydration + DOMPurify sanitization + React display).

    **`@learncard/types`**: `TemplateRenderMethodValidator` widened — `renderSuite` and `outputPreference.mediaType` are now `z.string()` (were `z.literal('svg-mustache')` and `z.literal('image/svg+xml')`). The literals couldn't express the W3C spec's openness to other suites/types and made the plugin's "future-extensible" read API contradictory. Backward-compatible: all existing literal values still validate.

    Behavior:

    -   `attachRenderMethod` is **opt-in**: calling it without a config returns the VC unchanged. Pass `{ templateId: DEFAULT_TEMPLATE_ID }` or a custom `{ templateId | templateValue }` to actually attach a render method. This avoids polluting every issued credential's `@context` with the render-method JSON-LD context URL.
    -   `templateId` must be an `http://` or `https://` URL. Empty values, `javascript:`, `file:`, `data:` and other schemes are rejected at the plugin boundary.
    -   `templateValue` is URL-encoded into a `data:image/svg+xml,` URI. Empty or whitespace-only values are rejected.
    -   The `useRenderMethodEnabled` LaunchDarkly flag gates display only (the `RenderMethodDisplay` component, the `BoostDisplayStyleSelector`, the `getSvgMustacheRenderMethod` lookup). It does not gate the write path.

    Known risk:

    -   The JSON-LD context URL (`https://digitalbazaar.github.io/vc-render-method-context/contexts/v2rc2.jsonld`) is a community-group draft, not a finalized W3C TR. VCs issued with this context depend on the URL remaining stable. Follow-up work will bundle the context locally and migrate to the W3C TR URL when published.

    Types:

    -   `@learncard/types` adds `TemplateRenderMethod`, `RenderMethod`, and a top-level `renderMethod` field on `UnsignedVC`.
    -   `learn-card-base` extends `BespokeLearnCard` to include `RenderMethodPlugin`, making `wallet.invoke.attachRenderMethod` and `wallet.invoke.buildTemplateRenderMethod` type-safe across the codebase.

-   Updated dependencies [[`3a05603c72d76020b43ec6bbd5e31b2b31c0fd2b`](https://github.com/learningeconomy/LearnCard/commit/3a05603c72d76020b43ec6bbd5e31b2b31c0fd2b), [`37439411ac68618fc27898ac4c0f48dbef4e424b`](https://github.com/learningeconomy/LearnCard/commit/37439411ac68618fc27898ac4c0f48dbef4e424b)]:
    -   @learncard/types@5.16.0

## 1.0.4

### Patch Changes

-   Updated dependencies [[`b61cfb80e80f382b22d673e7e826fc60528161e7`](https://github.com/learningeconomy/LearnCard/commit/b61cfb80e80f382b22d673e7e826fc60528161e7)]:
    -   @learncard/types@5.15.0

## 1.0.3

### Patch Changes

-   Updated dependencies [[`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02), [`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02)]:
    -   @learncard/types@5.14.0

## 1.0.2

### Patch Changes

-   Updated dependencies [[`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f), [`8e408e48f89db234bcb7d357787a0faf3a605488`](https://github.com/learningeconomy/LearnCard/commit/8e408e48f89db234bcb7d357787a0faf3a605488)]:
    -   @learncard/types@5.13.6

## 1.0.1

### Patch Changes

-   Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`4250d4814b6f38fc9ed9982a94bcfb830ea36edc`](https://github.com/learningeconomy/LearnCard/commit/4250d4814b6f38fc9ed9982a94bcfb830ea36edc), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    -   @learncard/types@5.13.5
