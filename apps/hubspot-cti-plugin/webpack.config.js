const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

/**
   * Customize the webpack by modifying the config object.
   * Consult https://webpack.js.org/configuration for more information
   */

module.exports = (config, { isProd, isDev, isTest }) => {
  config.resolve.plugins.push(
    new TsconfigPathsPlugin({
      configFile: './tsconfig.json',
      extensions: ['.ts', '.tsx', '.js'],
    })
  );
  config.resolve.symlinks = true;
  // config.module.rules.push({
  //   test: "/\.(png|jp(e*)g|svg|gif)$/",
  //   type: "asset/resource",
  // });
  return config;
}
