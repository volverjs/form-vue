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
                entry: path.resolve(import.meta.dirname, 'src/index.ts'),
                // `index.cjs` is what `require()` loads: in a `"type": "module"` package
                // Node runs every `.js` file as an ES module, including the UMD build,
                // which then exports nothing. The UMD build stays for `<script>` tags.
                formats: ['es', 'umd', 'cjs'],
                fileName: format => format === 'cjs' ? 'index.cjs' : `index.${format}.js`,
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
                tsconfigPath: 'tsconfig.build.json',
                // `.d.ts` for `import`, `.d.cts` for `require()`: a CommonJS consumer
                // resolving the ES module declarations would be told it cannot
                // `require()` the package.
                outDirs: ['dist', { dir: 'dist', moduleFormat: 'cjs' }],
                // The plugin rewrites `from './types.js'` to `.cjs` in the `.d.cts`
                // files but leaves most `import('./types.js')` types that TypeScript
                // synthesizes, which would mix the two trees: `FormFieldType` from
                // `enums.d.cts` and from `enums.d.ts` are distinct enum types.
                beforeWriteFile: (filePath, content) => filePath.endsWith('.d.cts')
                    ? { content: content.replace(/(['"])(\.\.?\/[^'"]+)\.js\1/g, '$1$2.cjs$1') }
                    : undefined,
                insertTypesEntry: true,
                exclude: ['**/test-*/**'],
            }),
        ],
    })
}
