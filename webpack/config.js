const path = require('path');

module.exports = {
    entry: {
        content: './extension/js/content',
        options: './extension/js/options',
    },
    output: {
        filename: './js/[name].js'
    },
    resolve: {
        modules: [path.join(__dirname, 'extension'), 'node_modules']
    },
    module: {
        rules: [{
            test: /\.js$/,
            loaders: ['babel-loader'],
            include: path.resolve(__dirname, '../extension/js')
        }]
    }
};
