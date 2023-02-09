const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');

module.exports = {
    entry: './src/index.js',
    resolveLoader: {
        modules: ['node_modules', 'setor'],
    },
    resolve: {
        extensions: ['.js', '.setor', '.json'],
        alias: {
            setor: resolve('./setor'),
        },
    },
    module: {
        rules: [
            {
                test: /\.setor$/,
                use: ['setor-loader'],
            },
            {
                test: /\.html$/,
                use: ['html-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './docs/index.html',
        }),
    ],
    devServer: {
        host: 'localhost',
        port: '7000',
        open: true,
        watchFiles: ['./src', './docs'],
    },
    mode: 'development',
};
