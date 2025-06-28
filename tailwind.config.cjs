/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#dc2626',
          green: '#16a34a',
          gold: '#eab308',
          silver: '#64748b',
          white: '#fefefe',
          'dark-red': '#991b1b',
          'dark-green': '#166534',
          'light-red': '#fecaca',
          'light-green': '#dcfce7',
          cream: '#fef3c7',
        },
        crypto: {
          bitcoin: '#F7931A',
          ethereum: '#627EEA',
          binance: '#F3BA2F',
        }
      },
      fontFamily: {
        'christmas': ['Mountains of Christmas', 'cursive'],
        'crypto': ['Orbitron', 'monospace'],
      },
      animation: {
        'snowfall': 'snowfall linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
      },
      keyframes: {
        snowfall: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.2)' },
        }
      },
      backgroundImage: {
        'christmas-gradient': 'linear-gradient(135deg, #dc2626 0%, #16a34a 100%)',
        'festive-gradient': 'linear-gradient(45deg, #eab308 0%, #dc2626 50%, #16a34a 100%)',
        'snow-gradient': 'linear-gradient(180deg, #fefefe 0%, #f1f5f9 100%)',
        'gold-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      },
    },
  },
  plugins: [],
};