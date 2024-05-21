const defaults = require('@wordpress/scripts/config/webpack.config');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
module.exports = env => {
  
  const dotenvFilename = env.production ? '.production.env' : '.development.env';
  console.log(env.production);
  return {
    ...defaults,
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    plugins: [
      new Dotenv({
        path: dotenvFilename,
      }),
      new webpack.DefinePlugin({
        process: {env: {}}
      }),
      new MiniCssExtractPlugin()
    ],
  }
};