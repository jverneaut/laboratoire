const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        },
      },
      {
        test: /\.(sc|c)ss$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|svg|jpe?g|gif|mp4)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              context: 'src',
              publicPath: '/',
              name: '[path]/[name].[ext]',
            },
          },
          {
            loader: 'img-loader',
            options: {
              plugins: [
                imageminMozjpeg({
                  quality: 90,
                }),
                imageminPngquant({
                  quality: [0.3, 0.6],
                }),
              ],
            },
          },
        ],
      },
      {
        test: /\.glsl$/,
        loader: 'webpack-glsl-loader',
      },
    ],
  },
};
