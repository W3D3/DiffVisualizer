var path = require('path');
module.exports = {
	entry: './lib/DiffVisualizer.js',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'diffvisualizer.js'
	},
	module: {
		loaders: [{
			test: path.join(__dirname, 'es6'),
			loader: 'babel-loader'
		}]
	},
	'env': {
      'browser': true,
      'jquery': true
  }
};
