const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { resolve } = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: resolve('build'),
        filename: './js/index.js',
        clean: true,
    },
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
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
        new NodePolyfillPlugin(),
    ],
    mode: 'production',
};
