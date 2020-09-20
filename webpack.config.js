const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlReplaceWebpackPlugin = require("html-replace-webpack-plugin");
const dotenv = require("dotenv");

module.exports = function (_env, argv) {
  const isProduction = argv.mode === "production";
  const isDevelopment = !isProduction;
  const envName = isProduction ? "stg.env" : "dev.env";

  const { parsed: env } = dotenv.config({ path: __dirname + `/${envName}` });

  return {
    devtool: isDevelopment && "cheap-module-source-map",
    entry: "./src/index.tsx",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "assets/js/[name].js",
      publicPath: "/",
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              envName: isProduction ? "production" : "development",
            },
          },
        },
        {
          test: /\.css$/,
          exclude: /node_modules/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: true,
                importLoaders: 1,
              },
            },
            "postcss-loader",
          ],
        },
        {
          test: /\.(png|jpg|gif)$/i,
          use: {
            loader: "url-loader",
            options: {
              limit: 8192,
              name: "static/media/[name].[hash:8].[ext]",
            },
          },
        },
        {
          test: /\.svg$/,
          use: ["@svgr/webpack"],
        },
        {
          test: /\.(eot|otf|ttf|woff|woff2)$/,
          loader: require.resolve("file-loader"),
          options: {
            name: "static/media/[name].[hash:8].[ext]",
          },
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    plugins: [
      isProduction &&
        new MiniCssExtractPlugin({
          filename: "assets/css/[name].[contenthash:8].css",
          chunkFilename: "assets/css/[name].[contenthash:8].chunk.css",
        }),
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(env),
      }),
      new ForkTsCheckerWebpackPlugin({
        async: false,
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
        inject: true,
      }),
      new HtmlReplaceWebpackPlugin({
        pattern: "/assets",
        replacement: env.PROJECT_CODE && isDevelopment ? `${env.PROJECT_CODE.toLowerCase()}/assets` : '/assets',
      }),
    ].filter(Boolean),
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserWebpackPlugin({
          terserOptions: {
            compress: {
              comparisons: false,
            },
            mangle: {
              safari10: true,
            },
            output: {
              comments: false,
              ascii_only: true,
            },
            warnings: false,
          },
        }),
        new OptimizeCssAssetsPlugin(),
      ],
      splitChunks: {
        chunks: "all",
        minSize: 0,
        maxInitialRequests: 20,
        maxAsyncRequests: 20,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name(module, chunks, cacheGroupKey) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return `${cacheGroupKey}.${packageName.replace("@", "")}`;
            },
          },
          common: {
            minChunks: 2,
            priority: -10,
          },
        },
      },
      runtimeChunk: "single",
    },
    devServer: {
      host: "0.0.0.0",
      compress: true,
      historyApiFallback: true,
      overlay: true,
      port: env.PORT ? parseInt(env.PORT) : 8080,
      disableHostCheck: true, // when manipulating /etc/hosts
    },
  };
};
