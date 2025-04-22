import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

const input = 'src/index.ts';

export default [
  {
    input,
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.mjs',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'FastIndexedDB',
        sourcemap: true
      }
    ],
    plugins: [
      json(),
      typescript(),
      resolve(),
      terser()
    ]
  }
];
