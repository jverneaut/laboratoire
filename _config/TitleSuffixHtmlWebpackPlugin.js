const HtmlWebpackPlugin = require('html-webpack-plugin');

class TitleSuffixHtmlWebpackPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      'TitleSuffixHtmlWebpackPlugin',
      (compilation) => {
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
          'TitleSuffixHtmlWebpackPlugin',
          (data, cb) => {
            const titleMatches = data.html.match(/<title>(.*?)<\/title>/g);
            if (!titleMatches) return cb(null, data);

            const title = titleMatches[0]
              .replace('<title>', '')
              .replace('</title>', '');

            data.html = data.html.replace(
              title,
              `${title} – WebGL and JavaScript Experiments`
            );

            cb(null, data);
          }
        );
      }
    );
  }
}

module.exports = TitleSuffixHtmlWebpackPlugin;
