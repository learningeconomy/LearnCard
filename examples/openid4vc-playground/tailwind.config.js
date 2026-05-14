/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            // Mirror the LearnCard app token palette so the playground
            // visually rhymes with what developers see in the wallet.
            colors: {
                grayscale: {
                    900: '#18224E',
                    800: '#353E64',
                    700: '#52597A',
                    600: '#6F7590',
                    500: '#8B91A7',
                    400: '#A8ACBD',
                    300: '#C5C8D3',
                    200: '#E2E3E9',
                    100: '#EFF0F5',
                    10: '#FBFBFC',
                },
            },
            fontFamily: {
                poppins: [
                    'Poppins',
                    'ui-sans-serif',
                    'system-ui',
                    'sans-serif',
                ],
                mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
            },
        },
    },
    plugins: [],
};
