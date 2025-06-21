/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', 
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        'mono': ['var(--font-geist-mono)', 'monospace'],
        'amiri': ['var(--font-amiri)', 'serif'],
      },
      colors: {
        'gold': '#FFD700', // Example gold color
        'gold-bright': '#FFEA00', // Brighter gold
        'desert-night': '#2C2A3D', // Dark purple-blue
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.2), 0 0 10px rgba(255, 215, 0, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-10px) translateX(10px)' },
          '50%': { transform: 'translateY(0) translateX(0)' },
          '75%': { transform: 'translateY(10px) translateX(-10px)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        glow: 'glow 3s infinite alternate',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
  // Enhanced purging configuration
  safelist: [
    // Keep critical animation classes
    'animate-pulse',
    'animate-spin',
    // Keep glass morphism classes
    'glass-morphism',
    'glass-morphism-dark',
    // Keep gradient classes
    'text-gradient-gold',
    'bg-gradient-to-br',
    'text-gradient-purple',
  ],
  // Remove unused utilities in production
  ...(process.env.NODE_ENV === 'production' && {
    purge: {
      enabled: true,
      content: ['./src/**/*.{js,ts,jsx,tsx}'],
    }
  }),
};

export default config;