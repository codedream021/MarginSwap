const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.tsx', // 처음 시작할 파일을 지정해줍니다. 지정하지 않으면 './src/index.js'가 기본 값이기 때문에 적어줘야 해요
  module: {
    rules: [
      {
        test: /\.tsx?$/, // .tsx 확장자로 끝나는 파일들을
        use: 'ts-loader', // ts-loader 가 트랜스파일 해줍니다.
        exclude: /node_modules/ // node_modules 디렉토리에 있는 파일들이 제외하고
      }, {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      },
      { enforce: 'post', test: /fontkit[/\\]index.js$/, loader: "transform-loader?brfs" },
      { enforce: 'post', test: /unicode-properties[/\\]index.js$/, loader: "transform-loader?brfs" },
      { enforce: 'post', test: /linebreak[/\\]src[/\\]linebreaker.js/, loader: "transform-loader?brfs" },
//      { test: /src[/\\]assets/, loader: 'arraybuffer-loader'},
      {
        test: /node_modules\/unicode-properties.*\.json$/,
        use: 'json-loader',
      },
      {
        test: /\.afm$/,
        loader: "raw-loader"
      },
      { test: /\.scss$/, use: [
        { loader: "style-loader" },  // to inject the result into the DOM as a style block
        { loader: "css-modules-typescript-loader"},  // to generate a .d.ts module next to the .scss file (also requires a declaration.d.ts with "declare modules '*.scss';" in it to tell TypeScript that "import styles from './styles.scss';" means to load the module "./styles.scss.d.td")
        { loader: "css-loader", options: { modules: true } },  // to convert the resulting CSS to Javascript to be bundled (modules:true to rename CSS classes in output to cryptic identifiers, except if wrapped in a :global(...) pseudo class)
        { loader: "sass-loader" },  // to convert SASS to CSS
        // NOTE: The first build after adding/removing/renaming CSS classes fails, since the newly generated .d.ts typescript module is picked up only later
      ] },
      {
        test: /\.less$/i,
        loader: [
          // compiles Less to CSS
          "style-loader",
          "css-loader",
          "less-loader",
        ],
      },

    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    alias: {
      fs: 'pdfkit/js/virtual-fs.js'
    }
  },
  output: {
    filename: 'bundle.js', // build시 만들어질 파일 번들 파일 이름
    path: path.resolve(__dirname, 'dist') // 그리고 경로 입니다.
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: './index.html'

    }) // './src/index.html' 경로의 html 파일에 번들 파일을 넣어줍니다.
  ],
}

