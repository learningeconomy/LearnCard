import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = {
    stories: ['../src/**/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-essentials'],
    framework: { name: '@storybook/react-vite', options: {} },
    typescript: {
        reactDocgen: false,
    },
    core: {
        builder: {
            name: '@storybook/builder-vite',
            options: {
                viteConfigPath: './storybook-vite.config.ts',
            },
        },
    },
};
export default config;
