const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.obj$/,
        use: {
          loader: 'webpack-obj-loader',
        },
      },
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
        test: /\.(png|jpe?g)$/,
        exclude: path.resolve(__dirname, '../app'),
        use: [
          {
            loader: 'responsive-loader',
            options: {
              adapter: require('responsive-loader/sharp'),
              context: 'src',
              publicPath: '/',
              name: '[path][name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g)$/,
        include: path.resolve(__dirname, '../app'),
        use: [
          {
            loader: 'responsive-loader',
            options: {
              adapter: require('responsive-loader/sharp'),
              publicPath: '/',
              name: '[path][name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(gif|mp4|svg|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              context: 'src',
              publicPath: '/',
              name: '[path][name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(glsl|frag|vert)$/,
        use: ['webpack-glsl-loader', 'glslify-loader'],
      },
    ],
  },
};
