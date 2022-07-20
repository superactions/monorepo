import { build, Loader, PluginBuild } from 'esbuild'
import { readFileSync } from 'fs'
import { dirname as _dirname, extname } from 'path'

const nodeModules = new RegExp(/^(?:.*[\\/])?node_modules(?:\/(?!postgres-migrations).*)?$/)

const dirnamePlugin = {
  name: 'dirname',

  setup(build: PluginBuild) {
    build.onLoad({ filter: /.*/ }, ({ path: filePath }) => {
      let contents = readFileSync(filePath, 'utf8')
      const extension = extname(filePath).substring(1)
      let loader = extension as Loader
      if (extension === 'cjs') loader = 'js'
      const dirname = _dirname(filePath)

      contents = contents.replace('__dirname', `"${dirname}"`).replace('__filename', `"${filePath}"`)
      return {
        contents,
        loader,
      }
    })
  },
}

build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  // minify: true,
  // sourcemap: true,
  platform: 'node',
  define: {
    BROWSER: 'true',
  },
  plugins: [dirnamePlugin],
}).catch(() => process.exit(1))
