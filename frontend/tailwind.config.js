/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#DC2626',
          green: '#16A34A',
          gold: '#FBBF24',
          snow: '#F8FAFC'
        },
        crypto: {
          bitcoin: '#F7931A',
          ethereum: '#627EEA',
          binance: '#F3BA2F'
        }
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'snowfall': 'snowfall linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        glow: {
          'from': { 
            boxShadow: '0 0 5px #16A34A, 0 0 10px #16A34A, 0 0 15px #16A34A' 
          },
          'to': { 
            boxShadow: '0 0 10px #16A34A, 0 0 20px #16A34A, 0 0 30px #16A34A' 
          }
        },
        snowfall: {
          'to': { transform: 'translateY(100vh)' }
        }
      },
      backgroundImage: {
        'christmas-gradient': 'linear-gradient(135deg, #DC2626 0%, #16A34A 50%, #DC2626 100%)',
        'winter-gradient': 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
        'crypto-gradient': 'linear-gradient(45deg, #F7931A 0%, #627EEA 50%, #F3BA2F 100%)'
      },
      fontFamily: {
        'christmas': ['Mountains of Christmas', 'cursive'],
        'crypto': ['Orbitron', 'monospace']
      }
    },
  },
  plugins: [],
}