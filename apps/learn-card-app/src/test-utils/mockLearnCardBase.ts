/**
 * Shared vitest mock factory for the `learn-card-base` module.
 *
 * The runtime barrel (learn-card-base/src/index.ts) pulls in heavy UI components
 * (e.g. BecomeTrustedIssuerForm -> @typeform/embed-react, which isn't resolvable
 * under the app's vitest resolver), so tests that only need CredentialCategoryEnum
 * stub the barrel with the REAL enum re-exported from its source module.
 *
 * Using `await import` of the source module (rather than redeclaring the enum)
 * keeps the SUT and the test sharing a single enum instance.
 *
 * Usage in a test file:
 *   vi.mock('learn-card-base', async () =>
 *       (await import('<relative>/test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
 *   );
 */
export const learnCardBaseEnumMock = async () => {
    const mod = await import('learn-card-base/types/boostAndCredentialMetadata');
    return { CredentialCategoryEnum: mod.CredentialCategoryEnum };
};
