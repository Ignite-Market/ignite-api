/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  context: __dirname,
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  entry: slsw.lib.entries,
  devtool: 'source-map',
  resolve: {
    extensions: ['.mjs', '.json', '.ts', '.js'],
    symlinks: false,
    cacheWithContext: false,
    alias: {
      '@nestjs/websockets': false,
      '@nestjs/websockets/socket-module': false,
      'cache-manager': false,
      'class-validator': false,
      'class-transformer': false,
      '@nestjs/microservices/microservices-module': false,
      '@nestjs/microservices': false,
      'bson-ext': false,
      kerberos: false,
      '@mongodb-js/zstd': false,
      snappy: false,
      'snappy/package.json': false,
      aws4: false,
      'mongodb-client-encryption': false,
      cardinal: false,
      'gcp-metadata': false,
    },
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  target: 'node',
  node: {
    __dirname: true,
  },
  externals: [
    nodeExternals({}),
  ],
  module: {
    rules: [
      // All files with a `.ts` or `.tsx` extension will be handled by `ts-loader`.
      {
        test: /\.(tsx?)$/,
        loader: 'ts-loader',
        exclude: [
          [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '.serverless'),
            path.resolve(__dirname, '.webpack'),
          ],
        ],
        options: {
          transpileOnly: true,
          experimentalWatchApi: true,
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './src/res/keys/*.pem' },
        { from: './src/lib/mailing/templates', to: 'src/lib/mailing/templates' }
      ]
    })
  ]
};
