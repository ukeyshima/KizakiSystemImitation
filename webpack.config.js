const path = require('path');
const src = path.resolve(__dirname, 'src');
const docs = path.resolve(__dirname, 'docs');

module.exports = {
  entry: [path.join(src, '/main.jsx')],
  output: {
    path: docs,
    filename: '[name].bundle.js'
  },
  devServer: {
    host: '0.0.0.0',
    contentBase: docs
  },
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.(css|scss)$/,
        loader: ['style-loader/useable', 'css-loader', 'sass-loader']
      },
      {
        test: /\.glsl$/,
        loader: 'glsl-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
