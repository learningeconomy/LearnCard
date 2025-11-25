/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                apple: {
                    blue: '#0071e3',
                    'blue-hover': '#0077ed',
                    gray: {
                        50: '#fbfbfd',
                        100: '#f5f5f7',
                        200: '#e8e8ed',
                        300: '#d2d2d7',
                        400: '#86868b',
                        500: '#6e6e73',
                        600: '#1d1d1f',
                    },
                },
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'SF Pro Display',
                    'SF Pro Text',
                    'Helvetica Neue',
                    'Helvetica',
                    'Arial',
                    'sans-serif',
                ],
            },
            boxShadow: {
                'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
                apple: '0 4px 12px rgba(0, 0, 0, 0.08)',
                'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
                'apple-xl': '0 12px 40px rgba(0, 0, 0, 0.16)',
            },
            borderRadius: {
                apple: '12px',
                'apple-lg': '18px',
                'apple-xl': '22px',
            },
        },
    },
    plugins: [],
};
