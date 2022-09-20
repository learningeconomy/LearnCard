// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'LearnCard',
    tagline: 'Powering Wallets of the Future',
    url: 'https://api.docs.learncard.com',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'Learning Economy', // Usually your GitHub org/user name.
    projectName: 'LearnCard', // Usually your repo name.

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: { defaultLocale: 'en', locales: ['en'] },

    plugins: [
        [
            'docusaurus-plugin-typedoc',
            {
                id: 'core',
                entryPoints: ['../packages/learn-card-core/src/index.ts'],
                tsconfig: '../packages/learn-card-core/tsconfig.json',
                out: 'core',
                sidebar: { categoryLabel: '@learncard/core' },
                watch: true,
            },
        ],
        [
            'docusaurus-plugin-typedoc',
            {
                id: 'types',
                entryPoints: ['../packages/learn-card-types/src/index.ts'],
                tsconfig: '../packages/learn-card-types/tsconfig.json',
                out: 'types',
                sidebar: { categoryLabel: '@learncard/types' },
                watch: true,
            },
        ],
        [
            'docusaurus-plugin-typedoc',
            {
                id: 'react',
                entryPoints: ['../packages/react-learn-card/src/index.ts'],
                tsconfig: '../packages/react-learn-card/tsconfig.json',
                out: 'react',
                sidebar: { categoryLabel: '@learncard/react' },
                watch: true,
            },
        ],
    ],

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: { sidebarPath: require.resolve('./sidebars.js') },
                theme: { customCss: require.resolve('./src/css/custom.css') },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                title: 'LearnCard API Reference',
                logo: { alt: 'LearnCard', src: 'img/LearnCard.png' },
                items: [
                    { to: 'https://docs.learncard.com', label: 'Guides', position: 'left' },
                    { to: 'docs/core', label: '@learncard/core', position: 'left' },
                    { to: 'docs/react', label: '@learncard/react', position: 'left' },
                    { to: 'docs/types', label: '@learncard/types', position: 'left' },
                    {
                        href: 'https://github.com/learningeconomy/LearnCard',
                        label: 'GitHub',
                        position: 'right',
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Docs',
                        items: [
                            { label: 'Guides', to: 'https://docs.learncard.com' },
                            { label: '@learncard/core', to: '/docs/core' },
                            { label: '@learncard/react', to: '/docs/react' },
                            { label: '@learncard/types', to: '/docs/types' },
                        ],
                    },
                    {
                        title: 'Community',
                        items: [
                            { label: 'LearnCard', href: 'https://learncard.com' },
                            { label: 'Discord', href: 'https://discord.gg/VYXptxkdSs' },
                        ],
                    },
                    {
                        title: 'More',
                        items: [
                            {
                                label: 'GitHub',
                                href: 'https://github.com/learningeconomy/LearnCard',
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Learning Economy Foundation. Built with Docusaurus.`,
            },
            prism: { theme: lightCodeTheme, darkTheme: darkCodeTheme },
        }),
};

module.exports = config;
