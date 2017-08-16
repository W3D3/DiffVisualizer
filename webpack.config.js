/* global require module __dirname */
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/DiffVisualizer.js',
    output: {
        path: path.join(__dirname, 'public/js'),
        filename: 'diffvisualizer.js'
    },
    module: {
        loaders: [{
            test: path.join(__dirname, 'es6'),
            loader: 'babel-loader'
        }]
    },
    plugins: [
        new CopyWebpackPlugin([

            // {output}/to/file.txt
            {
                context: __dirname,
                from: 'node_modules/mark.js/dist/jquery.mark.min.js',
                to: 'jquery.mark.min.js'
            },
            {
                context: __dirname,
                from: 'node_modules/bootbox/bootbox.min.js',
                to: 'bootbox.min.js'
            }

        ], {
            // By default, we only copy modified files during
            // a watch or webpack-dev-server build. Setting this
            // to `true` copies all files.
            copyUnmodified: true
        })
    ]
};
