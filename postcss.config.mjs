const prod = process.env.NODE_ENV === 'production';
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    ...(prod ? { cssnano: {} } : {}),
  },
};

export default config;
