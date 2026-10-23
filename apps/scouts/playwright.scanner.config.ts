import { defineConfig, devices } from '@playwright/test';

// These native-preview DOM checks do not need a server, login, or camera hardware.
export default defineConfig({
    testDir: './tests/scanner',
    outputDir: './coverage/playwright-scanner',
    reporter: 'list',
    use: { ...devices['Desktop Chrome'] },
});
