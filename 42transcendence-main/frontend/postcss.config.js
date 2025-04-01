module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer')({
      // Use browserslist config from package.json
    })
  ]
}; 