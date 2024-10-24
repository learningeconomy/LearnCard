const colors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');

module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            boxShadow: {
                bottom: '0px 4px 0px rgba(0, 0, 0, 0.25)',
                '3xl': '0px 0px 8px rgba(0, 0, 0, 0.25)',
                'bottom-2-4': '0px 2px 4px 0px rgba(0, 0, 0, 0.25)',
            },
            textShadow: {
                DEFAULT: '1px 2px 0px rgb(0 0 0 / 35%)',
            },
            spacing: {
                '25pct': '25%',
            },
            screens: {
                xxsm: { max: '240px' },
                // => @media (max-width: 240px) { ... }
                xxxsm: { max: '200px' },
                // => @media (max-width: 200px) { ... }
            },
            colors: {
                grayscale: {
                    50: '#FBFBFC',
                    100: '#EFF0F5',
                    200: '#E2E3E9',
                    300: '#C5C8D3',
                    400: '#A8ACBD',
                    500: '#8B91A7',
                    600: '#6F7590',
                    700: '#52597A',
                    800: '#353E64',
                    900: '#18224E',
                },
                emerald: {
                    50: '#D6FAF0',
                    100: '#BFEEE1',
                    200: '#9FE5D2',
                    300: '#80E0C6',
                    400: '#34EAB9',
                    500: '#40CBA6',
                    600: '#20C397',
                    700: '#00BA88',
                    800: '#008B66',
                    900: '#004633',
                },
                cyan: {
                    50: '#E7F9FD',
                    100: '#D0F3FC',
                    200: '#A0E7F8',
                    300: '#A0E7F8',
                    400: '#88E0F7',
                    500: '#71DAF5',
                    600: '#59D4F4',
                    700: '#41CEF2',
                    800: '#319BB5',
                    900: '#184D5B',
                },
                spice: {
                    50: '#FFEDE7',
                    100: '#FFDBCF',
                    200: '#FFB7A0',
                    300: '#FF9470',
                    400: '#FF7040',
                    500: '#FF5820',
                    600: '#FF4000',
                    700: '#DF3800',
                    800: '#BF3000',
                    900: '#802000',
                },
                indigo: {
                    50: '#EEF2FF',
                    100: '#E0E7FF',
                    200: '#C7D2FE',
                    300: '#A5B4FC',
                    400: '#818CF8',
                    500: '#6366F1',
                    600: '#4F46E5',
                    700: '#4338CA',
                    800: '#3730A3',
                    900: '#312E81',
                },
                blue: {
                    light: '#026BFF',
                    ocean: '#0094B4'
                },
                green: {
                    dark: '#05B65D',
                },
                orange: {
                    500: '#EF5D35',
                },
                red: {
                    mastercard: '#EB001B',
                },
            },
            fontFamily: {
                mouse: ['Mouse Memoirs'],
                montserrat: ['Montserrat', 'Helvetica', 'Serif'],
                poppins: ['Poppins'],
                jacques: ['Jacques Francois'],
                sacramento: ['Sacramento'],
                notoSans: ['Noto Sans', 'Poppins'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        plugin(function ({ matchUtilities, theme }) {
            matchUtilities(
                {
                    'text-shadow': value => ({
                        textShadow: value,
                    }),
                },
                { values: theme('textShadow') }
            );
        }),
        require('tailwind-scrollbar-hide'),
    ],
};
