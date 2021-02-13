const webpack = require('webpack')
const path = require('path')

module.exports = {
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: 'bundle.[fullhash].js',
  },
  devtool: false,
  optimization: {
    minimize: true,
  },
  plugins: [],
}
