import { expect as baseExpect } from '@playwright/test';

/**
 * The verifier drives a cold Vite dev server: first loads compile hundreds of modules and can
 * exceed Playwright's 5s default. One shared budget avoids sprinkling per-assertion timeouts.
 */
export const expect = baseExpect.configure({ timeout: 30_000 });
