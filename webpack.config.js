/* global require module __dirname process */
var path = require('path');
// var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
// const extractSass = new ExtractTextPlugin({
//     filename: '[name].[contenthash].css',
//     // disable: process.env.NODE_ENV === 'development'
// });

module.exports = {
    entry: ['./src/DiffVisualizer.js', './src/sass/main.scss'],
    output: {
        path: path.join(__dirname, 'public/dist'),
        filename: 'bundle.js'
    },
    devServer: {
        contentBase: './public/'
    },
    module: {
        loaders: [
            // {
            //     test: /\.js$/,
            //     loader: 'babel-loader'
            // },
            // { // regular css files
            //     test: /\.css$/,
            //     loader: ExtractTextPlugin.extract({
            //         loader: 'css-loader?importLoaders=1'
            //     })
            // },
            {
                test: /\.(sass|scss)$/,
                loader: ExtractTextPlugin.extract([{
                    loader: 'css-loader',
                    options: process.env.NODE_ENV === 'production' ? {
                        minimize: true
                    } : {
                        minimize: false
                    }
                }, {
                    loader: 'sass-loader'
                }]),

            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader'
            }
        ]
    },
    plugins: [
        // new CopyWebpackPlugin([
        //
        //     // {output}/to/file.txt
        //
        //     //mark.js
        //     {
        //         context: __dirname,
        //         from: 'node_modules/mark.js/dist/jquery.mark.min.js',
        //         to: 'jquery.mark.min.js'
        //     },
        //     //bootbox
        //     {
        //         context: __dirname,
        //         from: 'node_modules/bootbox/bootbox.min.js',
        //         to: 'bootbox.min.js'
        //     },
        //     // boostrap notify
        //     {
        //         context: __dirname,
        //         from: 'node_modules/bootstrap-notify/bootstrap-notify.min.js',
        //         to: 'bootstrap-notify.min.js'
        //     }
        //
        // ], {
        //     // By default, we only copy modified files during
        //     // a watch or webpack-dev-server build. Setting this
        //     // to `true` copies all files.
        //     copyUnmodified: true
        // }),
        new ExtractTextPlugin({
            filename: 'main.bundle.css'
        })
    ]
};
