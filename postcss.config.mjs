// Import the custom Tailwind prefix plugin

export default {
  plugins: {
    '@tailwindcss/postcss': {
      // Ensure the correct configuration file is used when processing CSS
      config: './tailwind.config.js',
    },
  },
}
