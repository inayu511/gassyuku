import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        line: {
          green: '#06C755',
          dark: '#00B900',
        },
        accent: {
          coral: '#FF6B6B',
          amber: '#F59E0B',
          sky: '#0EA5E9',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'float': '0 12px 28px -4px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
};
export default config;
