const HtmlWebpackPlugin = require('html-webpack-plugin');
const { join } = require('path');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: join(__dirname, '../src/overlay.html'),
      filename: 'overlay.html',
      inject: true,
      chunks: [''],
      alwaysWriteToDisk: true,
    }),
  ],
};
