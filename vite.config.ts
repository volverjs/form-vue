import path from 'path'
import { defineConfig, configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import ESLint from '@nabla/vite-plugin-eslint'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default () => {
	return defineConfig({
		test: {
			globals: true,
			environment: 'happy-dom',
			exclude: [...configDefaults.exclude, 'test-playwright/**'],
		},
		build: {
			lib: {
				name: '@volverjs/form-vue',
				entry: path.resolve(__dirname, 'src/index.ts'),
				fileName: (format) => `index.${format}.js`,
			},
			rollupOptions: {
				external: [
					'vue',
					'zod',
					'@vueuse/core',
					new RegExp(`^@volverjs(?:/.+)?$`),
				],
				output: {
					exports: 'named',
					globals: {
						vue: 'Vue',
						zod: 'zod',
						'@vueuse/core': 'VueUseCore',
					},
				},
			},
		},
		plugins: [
			// https://github.com/vitejs/vite-plugin-vue
			vue(),

			// https://github.com/gxmari007/vite-plugin-eslint
			ESLint(),

			// https://github.com/qmhc/vite-plugin-dts
			dts({
				insertTypesEntry: true,
				exclude: ['**/test-*/**'],
			}),
		],
	})
}
