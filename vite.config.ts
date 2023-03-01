import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import ESLint from 'vite-plugin-eslint'
import path from 'path'

// https://vitejs.dev/config/
export default () => {
	return defineConfig({
		test: {
			globals: true,
			environment: 'happy-dom',
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
					new RegExp(`^@volverjs/style(?:/.+)?$`),
					new RegExp(`^@volverjs/ui-vue(?:/.+)?$`),
				],
				output: {
					globals: {
						vue: 'Vue',
					},
				},
			},
		},
		plugins: [vue(), ESLint()],
	})
}
