import path from 'path'
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() { if (server) server.kill(0) };

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	}
};

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
		svelte({
			compilerOptions: { dev: !production },
			onwarn: (w, h) => { if (w.code === 'a11y-missing-attribute') return; h(w) }
		}),

		alias({
			entries: [
				{ find: 'lib', replacement: path.resolve(__dirname, "src/lib") },
				{ find: 'public', replacement: path.resolve(__dirname, "public") }
			]
		}),

		css({ output: 'bundle.css' }),
		resolve({ mainFields: ['browser'], browser: true }),
		commonjs(),

		!production && livereload('public'),
		production && terser()
	],
	watch: { clearScreen: false }
};