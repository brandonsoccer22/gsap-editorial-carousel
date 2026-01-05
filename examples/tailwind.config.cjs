module.exports = {
  content: [
     "!./node_modules/**",
    "./**/*.{html,js,ts,tsx}"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px', // Adds a new 'xs' breakpoint
        'ml': '961px', // Adds a new 'ml' breakpoint
        '3xl': '1600px', // Adds a new '3xl' breakpoint
      }
    }
  },
  plugins: []
};
