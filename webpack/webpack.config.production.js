const webpack = require('webpack');
const path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: 'bundle.[hash].js'
  },
  devtool: false,
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]
};
