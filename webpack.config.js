var path = require('path');
module.exports = {
	entry: './lib/DiffVisualizer.js',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'diffvisualizer.js',
		library: 'DiffVisualizer',
		libraryTarget: 'var'
	},
	externals: {
        // require("jquery") is external and available
        //  on the global var jQuery
		'jquery': 'jQuery',
		'base64' : 'Base64'
	},
	module: {
		loaders: [
			{ test: path.join(__dirname, 'es6'),
				loader: 'babel-loader' }
		]
	}
};
