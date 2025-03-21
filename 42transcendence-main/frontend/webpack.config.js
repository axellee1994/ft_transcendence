const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');

// Custom plugin to remove unwanted script tags
class RemoveIndexTsScriptPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('RemoveIndexTsScriptPlugin', (compilation) => {
      const outputPath = compilation.outputOptions.path;
      const indexFile = path.join(outputPath, 'index.html');
      
      if (fs.existsSync(indexFile)) {
        let htmlContent = fs.readFileSync(indexFile, 'utf8');
        // Remove any script tag referencing index.ts
        htmlContent = htmlContent.replace(/<script[^>]*src="index.ts"[^>]*><\/script>/g, '');
        fs.writeFileSync(indexFile, htmlContent);
      }
    });
  }
}

module.exports = {
  entry: {
    app: './src/index.ts'
  },
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              // Skip type checking for faster builds
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/
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
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      cache: false,
      scriptLoading: 'blocking'
    }),
    new RemoveIndexTsScriptPlugin()
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/'
    },
    port: 4000,
    host: '0.0.0.0',
    hot: true,
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true
    },
    allowedHosts: 'all',
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      overlay: true,
      progress: true
    },
    liveReload: true
  }
}; 