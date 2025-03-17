const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.ts',
    singlePlayer: './src/single-player.ts',
    multiPlayer: './src/multi-player.ts'
  },
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(glb|gltf)$/,
        type: 'asset/resource'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['index'],
      cache: false
    }),
    new HtmlWebpackPlugin({
      template: './src/single-player.html',
      filename: 'single-player.html',
      chunks: ['singlePlayer'],
      cache: false
    }),
    new HtmlWebpackPlugin({
      template: './src/multi-player.html',
      filename: 'multi-player.html',
      chunks: ['multiPlayer'],
      cache: false
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/',
      watch: true
    },
    port: 4000,
    host: '0.0.0.0',
    hot: false,
    liveReload: true,
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true,
      index: true,
      mimeTypes: { 'text/html': ['html'] },
      publicPath: '/',
      serverSideRender: true
    },
    allowedHosts: 'all',
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      overlay: true,
      progress: true
    },
    watchFiles: ['src/**/*'],
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      return middlewares;
    }
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      name: false
    }
  }
}; 