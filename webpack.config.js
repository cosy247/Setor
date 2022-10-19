const path = require("path");

module.exports = {
  entry: "./test/src/main.js",
  output: {
    path: path.resolve(__dirname, "test/build"),
    filename: "main.js"
  },
  module: {
    rules : [
      {
        test:/\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test:/\.less$/,
        use: ["style-loader", "css-loader","less-loader"]
      },
      {
        test:/\.s[ac]ss$/,
        use: ["style-loader", "css-loader","less-loader"]
      },
      {
        test:/\.styl$/,
        use: ["style-loader", "css-loader","stylus-loader"]
      },
      {
        test: /\.(jpe?g|png|gif|webp|svg)$/,
        type: "asset",
        parser:{
          dataUrlCondition: {
            maxSize: 10 * 1024
          }
        }
      }
    ]
  },
  plugins: [

  ],
  mode: "development"
}