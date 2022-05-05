/* eslint-disable no-undef */

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const { VueLoaderPlugin: Vue2LoaderPlugin } = require('vue-loader')
const { VueLoaderPlugin: Vue3LoaderPlugin } = require('vue-loader-next')

const baseConfig = {
  mode: 'production',
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  edge: '17',
                  firefox: '60',
                  chrome: '67',
                  safari: '11.1',
                },
                useBuiltIns: 'usage',
              },
            ],
          ], //Preset used for env setup
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // 将 JS 字符串生成为 style 节点
          'style-loader',
          // 将 CSS 转化成 CommonJS 模块
          'css-loader',
          // 将 Sass 编译成 CSS
          'sass-loader',
        ],
      },
      {
        test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        options: {
          inline: 'fallback',
        },
      },
    ],
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
      }),
    ],
  },
  externals: {
    vue: 'vue',
  },
  performance: {
    hints: false,
  },
}

module.exports = [
  {
    ...baseConfig,
    output: {
      filename: 'vue2-pdf-viewer.js',
      library: {
        name: 'pdf-viewer-vue',
        type: 'umd',
      },
    },
    plugins: [new Vue2LoaderPlugin()],
  },
  {
    ...baseConfig,
    output: {
      filename: 'vue3-pdf-viewer.js',
      library: {
        name: 'pdf-viewer-vue',
        type: 'umd',
      },
    },
    plugins: [new Vue3LoaderPlugin()],
  },
]
