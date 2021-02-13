const webpack = require('webpack')
const path = require('path')

module.exports = {
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, '..', 'dist'),
    historyApiFallback: true,
  },
  plugins: [],
}
