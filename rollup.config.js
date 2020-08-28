import nodeResolve from '@rollup/plugin-node-resolve'

export default {
  input: 'snabbdom/build/package/jsx.js',
  output: {
    dir: `${__dirname}/jsx`,
    entryFileNames: 'index.js',
    sourceMap: true,
    format: 'cjs'
  },
  plugins: [
    nodeResolve({
      mainFields: ['module'],
      browser: true,
      preferBuiltins: false
    }),
  ]
}