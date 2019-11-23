const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const { uglify } = require('rollup-plugin-uglify');

const extensions = [ '.ts', '.js' ];

module.exports = exports = [
    {
        input: './src/index.ts',
        output: {
            file: './dist/large-list.esm.js',
            format: 'esm',
        },
        plugins: [
            resolve({
                extensions,
            }),
            commonjs(),
            babel({
                exclude: 'node_modules/**',
                extensions,
            }),
        ],
    },
    {
        input: './src/index.ts',
        output: {
            file: './dist/large-list.cjs.js',
            format: 'cjs',
        },
        plugins: [
            resolve({
                extensions,
            }),
            commonjs(),
            babel({
                exclude: 'node_modules/**',
                extensions,
            }),
        ],
    },
    {
        input: './src/index.ts',
        output: {
            file: './dist/large-list.js',
            name: 'LargeList',
            format: 'umd',
        },
        plugins: [
            resolve({
                extensions,
            }),
            commonjs(),
            babel({
                exclude: 'node_modules/**',
                extensions,
            }),
        ],
    },
    {
        input: './src/index.ts',
        output: {
            file: './dist/large-list.min.js',
            name: 'LargeList',
            format: 'umd',
        },
        plugins: [
            resolve({
                extensions,
            }),
            commonjs(),
            babel({
                exclude: 'node_modules/**',
                extensions,
            }),
            uglify(),
        ],
    },
];