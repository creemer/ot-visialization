var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: './src/visualization_source.js',
    resolve: {
        modules: [
            path.join(__dirname, 'src'),
            path.join(__dirname, 'node_modules')
        ]
    },
    output: {
        libraryTarget: 'amd',
        filename: 'visualization.js'
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
        'splunkjs/mvc/utils'
    ],
    module: {
        loaders: [{
            test: /\.css$/,
            loader: ['style-loader', 'css-loader']
        }, {
            test: /\.jsx?$/,
            loader: 'babel-loader',
            include: /src/,
            query: {
                presets: ['es2015']
            }
        }]
    }
};
