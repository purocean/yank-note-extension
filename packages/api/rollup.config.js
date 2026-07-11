import ttypescript from 'ttypescript'
import typescript from 'rollup-plugin-typescript2'
import sourceMaps from 'rollup-plugin-sourcemaps'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({
      include: ['*.ts', '*.tsx', '**/*.ts', '**/*.tsx'],
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        exclude: ['node_modules', 'lib', 'types', '__tests__']
      },
      typescript: ttypescript
    }),
    sourceMaps(),
    terser()
  ],
  output: [
    {
      format: 'cjs',
      file: 'lib/bundle.cjs.js',
      sourcemap: true
    },
    {
      format: 'es',
      file: 'lib/bundle.esm.js',
      sourcemap: true
    }
  ]
}
