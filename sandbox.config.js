const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  webpack: {
    plugins: [
      new CopyPlugin({
        patterns: [{ from: '../public/' }],
      }),
    ],
    module: {
      rules: [
        { test: /\.mp4$/, use: ['file-loader'] },
        { test: /\.obj$/, use: ['webpack-obj-loader'] },
        { test: /\.(glsl|frag|vert)$/, use: ['raw-loader'] },
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
      ],
    },
    resolve: {
      fallback: {
        fs: false,
      },
    },
  },
};
