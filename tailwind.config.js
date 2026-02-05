/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                sidebar: '#0c0c0e',
                mainDark: '#1a1b20',
                cardDark: '#27272a',
                activeBlue: '#1e3a5f', // Changed to Navy
                actionBlue: '#1e3a5f',
                borderGray: '#52525b',
                gold: '#c9a857',
                navy: '#1e3a5f',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
