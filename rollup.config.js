import nodeResolve from '@rollup/plugin-node-resolve'

const createConfig = (name) => ({
  input: `snabbdom/build/package/${name}.js`,
  output: {
    dir: `${__dirname}/lib`,
    entryFileNames: `${name}.js`,
    format: 'cjs'
  },
  plugins: [
    nodeResolve({
      mainFields: ['module'],
      browser: true,
      preferBuiltins: false
    }),
  ]
})

export default ['h', 'jsx'].map(createConfig);
