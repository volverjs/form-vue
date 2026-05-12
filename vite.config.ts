import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import vue from '@vitejs/plugin-vue'
import ESLint from '@nabla/vite-plugin-eslint'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default () => {
    return defineConfig({
        test: {
            globals: true,
            projects: [
                {
                    test: {
                        name: 'unit',
                        include: ['test-vitest/**/*.test.ts'],
                        environment: 'happy-dom',
                    },
                },
                {
                    plugins: [vue()],
                    test: {
                        name: 'browser',
                        include: ['test-playwright/**/*.spec.ts'],
                        setupFiles: ['./test-playwright/setup.ts'],
                        browser: {
                            enabled: true,
                            provider: playwright(),
                            headless: true,
                            instances: [{ browser: 'chromium' }],
                        },
                    },
                },
            ],
        },
        build: {
            lib: {
                name: '@volverjs/form-vue',
                entry: path.resolve(__dirname, 'src/index.ts'),
                fileName: format => `index.${format}.js`,
            },
            rollupOptions: {
                external: [
                    'vue',
                    'zod',
                    'zod/v3',
                    'zod/v4',
                    'zod/v4/core',
                    'dot-prop',
                    '@vueuse/core',
                    /^@volverjs(?:\/.+)?$/,
                ],
                output: {
                    exports: 'named',
                    globals: {
                        'vue': 'Vue',
                        'zod': 'zod',
                        'zod/v3': 'zodV3',
                        'zod/v4': 'zodV4',
                        'zod/v4/core': 'zodV4Core',
                        'dot-prop': 'dotProp',
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
