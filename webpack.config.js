var path = require('path');
module.exports = {
	entry: './lib/DiffVisualizer.js',
	output: {
		path: path.join(__dirname, 'public/js'),
		filename: 'diffvisualizer.js'
	},
	module: {
		loaders: [{
			test: path.join(__dirname, 'es6'),
			loader: 'babel-loader'
		}]
	}
};
