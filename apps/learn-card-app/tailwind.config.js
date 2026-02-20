const colors = require('tailwindcss/colors');

module.exports = {
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
        '../../packages/learn-card-base/src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        fontFamily: {
            mouse: ['Poppins', 'sans-serif'],
            poppins: ['Poppins', 'sans-serif'],
            montserrat: ['Poppins', 'sans-serif'],
            notoSans: ['Noto Sans', 'Poppins', 'sans-serif'],
            jacques: ['JacquesFrancois', 'Noto Sans', 'Poppins'],
            fluentEmoji: ['Fluent Emoji Flat'],
        },
        screens: {
            desktop: { min: '992px' },
            mobile: { min: '991px' },
            phone: { max: '479px' },
            xs: { max: '375px' }, // iphone se
            xxs: { max: '320px' },
            sm: '640px',
            md: '768px',
        },
        extend: {
            animation: {
                'pulse-opacity': 'pulse-opacity 1s infinite',
                'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
                'typing-dot': 'typing-dot 1.4s infinite ease-in-out',
                'chat-in': 'chat-in 250ms ease-out forwards',
                'chat-in-mine': 'chat-in-mine 250ms ease-out forwards',
                'spin-custom': 'spin-custom 1s linear infinite',
            },
            keyframes: {
                'pulse-opacity': {
                    '0%': { opacity: '0' },
                    '50%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                'fade-in-up': {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(10px)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                'typing-dot': {
                    '0%, 100%': {
                        transform: 'translateY(0)',
                        opacity: '0.4',
                    },
                    '50%': {
                        transform: 'translateY(-2px)',
                        opacity: '0.8',
                    },
                },
                'chat-in': {
                    '0%': {
                        opacity: '0',
                        transform: 'translateX(-8px) scale(0.96)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateX(0) scale(1)',
                    },
                },
                'chat-in-mine': {
                    '0%': {
                        opacity: '0',
                        transform: 'translateX(8px) scale(0.96)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateX(0) scale(1)',
                    },
                },
                'spin-custom': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
            },
            boxShadow: {
                bottom: '0px 4px 0px rgba(0, 0, 0, 0.25)',
                'box-bottom': '0px 2px 4px 0px rgba(0, 0, 0, 0.25)',
                '3xl': '0px 0px 8px rgba(0, 0, 0, 0.25)',
                'button-bottom': '0px 3px 4px 0px rgba(0, 0, 0, 0.25);',
                'bottom-4-4': '0px 4px 4px 0px rgba(0, 0, 0, 0.25);',
                'bottom-1-4': '0px 1px 4px 0px rgba(0, 0, 0, 0.25);',
                footer: '0px -4px 4px 0px rgba(0, 0, 0, 0.10)',
                'bottom-2-3': '0px 2px 3px 0px rgba(24, 34, 78, 0.30)',
                'bottom-2-4': '0px 2px 4px 0px rgba(0, 0, 0, 0.25);',
                'bottom-2-6': '0px 2px 6px 0px rgba(0, 0, 0, 0.25)',
                'soft-top': '0px -2px 3px 0px rgba(24, 34, 78, 0.20)',
                header: '0px 1px 5px 0px rgba(0, 0, 0, 0.25);',
                'soft-bottom': '0px 2px 2px 0px rgba(0, 0, 0, 0.25)',
                'bottom-3-4': '0px 3px 4px 0px rgba(0, 0, 0, 0.25);',
                'bottom-1-5': '0px 1px 5px 0px rgba(0, 0, 0, 0.25);',
                'bottom-0-4': '0px 0px 4px 0px rgba(0, 0, 0, 0.25);',
                'bottom-3-8': '0px 3px 8px 0px rgba(0, 0, 0, 0.30);',
            },
            backgroundImage: {
                'gradient-rainbow':
                    'linear-gradient(90deg, #B1EF6B 0%, #10B981 20%, #00A7C3 40%, #6366F1 60%, #F88DCA 80%, #FFD573 100%)',
            },
            dropShadow: {
                bottom: '0px 2px 4px rgba(0, 0, 0, 0.25)',
            },
            zIndex: {
                9999: '9999',
            },
            colors: {
                ...colors,
                'off-white': {
                    50: '#FBFBFC',
                },
                grayscale: {
                    10: '#FBFBFC',
                    20: '#EFF0F5',
                    30: '#E2E3E9',
                    50: '#FBFBFC',
                    70: '#6F7590',
                    80: '#52597A',
                    90: '#353E64',
                    100: '#EFF0F5',
                    200: '#E2E3E9',
                    300: '#C5C8D3',
                    400: '#A8ACBD',
                    500: '#8B91A7',
                    600: '#6F7590',
                    700: '#52597A',
                    800: '#353E64',
                    900: '#18224E',
                    line: '#E3E5E8',
                },
                emerald: {
                    50: '#ECFDF5',
                    100: '#BFEEE1',
                    200: '#9FE5D2',
                    201: '#A7F3D0',
                    300: '#80E0C6',
                    400: '#34EAB9',
                    401: '#34D399',
                    500: '#40CBA6',
                    501: '#10B981',
                    600: '#20C397',
                    601: '#059669',
                    700: '#00BA88',
                    701: '#047857', //
                    800: '#008B66',
                    900: '#004633',
                },
                cyan: {
                    50: '#E7F9FD',
                    100: '#D0F3FC',
                    101: '#CFFAFE',
                    200: '#A0E7F8',
                    201: '#A5F3FC',
                    300: '#A0E7F8',
                    301: '#67E8F9', // some seemingly unintentional discrepancies with Figma colors, so we'll +1
                    400: '#88E0F7',
                    401: '#22D3EE',
                    500: '#71DAF5',
                    501: '#06B6D4',
                    600: '#59D4F4',
                    601: '#0891B2',
                    700: '#41CEF2',
                    701: '#0E7490',
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
                violet: {
                    200: '#DDD6FE',
                    300: '#C4B5FD',
                    400: '#A78BFA',
                    500: '#8B5CF6',
                    700: '#6D28D9',
                },
                teal: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#312E81',
                },
                lime: {
                    50: '#F7FEE7',
                    100: '#ECFCCB',
                    200: '#D9F99D',
                    300: '#BEF264',
                    400: '#A3E635',
                    500: '#84CC16',
                    600: '#65A30D',
                    700: '#4D7C0F',
                    800: '#3F6212',
                    900: '#365314',
                },
                amber: {
                    50: '#FFFBEB',
                    100: '#FEF3C7',
                    200: '#FDE68A',
                    300: '#FCD34D',
                    400: '#FBBF24',
                    500: '#F59E0B',
                    600: '#D97706',
                    700: '#B45309',
                    800: '#92400E',
                    900: '#78350F',
                },
                pink: {
                    200: '#FBCFE8',
                    300: '#F9A8D4',
                    400: '#F472B6',
                    500: '#EC4899',
                    600: '#DB2777',
                    700: '#BE185D',
                },
                mv_blue: {
                    700: '#0A74BC',
                },
                blue: {
                    light: '#026BFF',
                    200: '#BFDBFE',
                    300: '#93C5FD',
                    400: '#60A5FA',
                    500: '#3B82F6',
                    700: '#1D4ED8',
                    950: '#18224E',
                },
                'light-blue': {
                    500: '#0EA5E9',
                },
                green: {
                    dark: '#05B65D',
                },
                orange: {
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#F97316',
                    600: '#EA580C',
                    800: '#9A3412',
                },
                red: {
                    mastercard: '#EB001B',
                },
                yellow: {
                    200: '#FEF08A',
                    300: '#FDE047',
                    400: '#FACC15',
                    500: '#EAB308',
                    700: '#A16207',
                },
                sp: {
                    purple: {
                        base: '#622599',
                        light: '#9969C2',
                        'light-medium': '#A670D6',
                        lighter: '#B895D6',
                        lightest: '#F1EBF8',
                        midnight: '#4D006E',
                        soft: '#9969C2',
                    },
                },
                'primary-default': '#0094F6',
            },
            utilities: {
                '.animation-delay-300': {
                    'animation-delay': '300ms',
                },
                '.animation-delay-600': {
                    'animation-delay': '600ms',
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/line-clamp'),
        require('tailwind-gradient-mask-image'), // Add a plugin for animation delays
        function ({ addUtilities }) {
            const newUtilities = {
                '.animation-delay-200': {
                    'animation-delay': '200ms',
                },
                '.animation-delay-400': {
                    'animation-delay': '400ms',
                },
            };
            addUtilities(newUtilities);
        },
    ],
};
