const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = {
  entry: "./test/src/main.js",
  output: {
    path: path.resolve(__dirname, "../../test/build"),
    filename: "../../test/build/js/main.js",
    clean:true
  },
  module: {
    rules : [
      {
        test:/\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        test:/\.less$/,
        use: [MiniCssExtractPlugin.loader, "css-loader","less-loader"]
      },
      {
        test:/\.s[ac]ss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader","less-loader"]
      },
      {
        test:/\.styl$/,
        use: [MiniCssExtractPlugin.loader, "css-loader","stylus-loader"]
      },
      {
        test: /\.(jpe?g|png|gif|webp|svg)$/,
        type: "asset",
        parser:{
          dataUrlCondition: {
            maxSize: 10 * 1024
          }
        },
        generator:{
          filename:"media/[hash:10][ext][query]",
        }
      },
      {
        test: /\.(ttf|woff2|mp3|mp4|avi)$/,
        type: "asset/resourse",
        generator:{
          filename:"media/[hash:10][ext][query]",
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  plugins: [
    new ESLintWebpackPlugin({
      context: path.resolve(__dirname, "../../test")
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../../test/public/index.html")
    }),
    new MiniCssExtractPlugin({
      filename:"./test/build/css/main.css"
    })
  ],
  mode: "production"
}