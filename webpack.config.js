/* global require module __dirname process */
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
// const Uglify = require('uglifyjs-webpack-plugin');

const extractSass = new ExtractTextPlugin({
    filename: '[name].bundle.css',
    allChunks: true
});

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
                loader: extractSass.extract([{
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
        new CopyWebpackPlugin([

            // {output}/to/file.txt
            //jquery
            {
                context: __dirname,
                from: 'node_modules/jquery/dist/jquery.min.js',
                to: 'jquery.min.js'
            },
            //bootstrap
            {
                context: __dirname,
                from: 'node_modules/bootstrap-sass/assets/javascripts/bootstrap.min.js',
                to: 'bootstrap.min.js'
            },
            //scrollTo jquery
            {
                context: __dirname,
                from: 'node_modules/jquery.scrollto/jquery.scrollTo.min.js',
                to: 'jquery.scrollTo.min.js'
            },
            //highlightjs
            {
                context: __dirname,
                from: 'node_modules/highlightjs/highlight.pack.min.js',
                to: 'highlight.pack.min.js'
            },
            //highlightjs line numbers
            {
                context: __dirname,
                from: 'node_modules/highlightjs-line-numbers.js/dist/highlightjs-line-numbers.min.js',
                to: 'highlightjs-line-numbers.min.js'
            },
            //bootstrap-toggle
            {
                context: __dirname,
                from: 'node_modules/bootstrap-toggle/js/bootstrap2-toggle.min.js',
                to: 'bootstrap2-toggle.min.js'
            },
            //mark.js
            {
                context: __dirname,
                from: 'node_modules/mark.js/dist/jquery.mark.min.js',
                to: 'jquery.mark.min.js'
            },
            //bootbox
            {
                context: __dirname,
                from: 'node_modules/bootbox/bootbox.min.js',
                to: 'bootbox.min.js'
            },
            // boostrap notify
            {
                context: __dirname,
                from: 'node_modules/bootstrap-notify/bootstrap-notify.min.js',
                to: 'bootstrap-notify.min.js'
            },
            // twitter-bootstrap-wizard
            {
                context: __dirname,
                from: 'node_modules/twitter-bootstrap-wizard/jquery.bootstrap.wizard.min.js',
                to: 'jquery.bootstrap.wizard.min.js'
            },
            //jquery.validate.min.js
            {
                context: __dirname,
                from: 'node_modules/jquery-validation/dist/jquery.validate.min.js',
                to: 'jquery.validate.min.js'
            },
        ], {
            // By default, we only copy modified files during
            // a watch or webpack-dev-server build. Setting this
            // to `true` copies all files.
            copyUnmodified: true
        }),
        extractSass,
        // new Uglify()
    ]
};
