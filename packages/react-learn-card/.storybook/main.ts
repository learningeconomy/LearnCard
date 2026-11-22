import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = {
    stories: ['../src/**/**/*.stories.@(js|jsx|ts|tsx)'],
    // Storybook 9 folded essentials into core; docs stays an addon.
    addons: ['@storybook/addon-docs'],
    framework: {
        name: '@storybook/react-vite',
        options: { builder: { viteConfigPath: './storybook-vite.config.ts' } },
    },
    typescript: {
        reactDocgen: false,
    },
};
export default config;
