import antfu from '@antfu/eslint-config'

export default antfu({
    typescript: {
        overrides: {
            'ts/consistent-type-definitions': 'off',
        },
    },
    vue: true,
    node: true,
    yaml: false,
    stylistic: {
        indent: 4,
        quotes: 'single',
        semi: false,
    },
    rules: {
        'sort-imports': 'off',
        'perfectionist/sort-imports': 'off',
        'perfectionist/sort-named-imports': 'off',
        'antfu/top-level-function': 'off',
    },
}, {
    ignores: ['.vscode', 'dist', 'node_modules', '*.config.ts', '**/*.test.ts'],
})
