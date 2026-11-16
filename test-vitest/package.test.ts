/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { it, expect, describe } from 'vitest'

/**
 * Checks the package as consumers install it, not as this repository compiles it: the
 * declarations once shipped extensionless relative imports, a relative path into this
 * repository's `node_modules` and type parameters they never declared. None of that
 * showed up here, because `src/` compiles with `moduleResolution: "bundler"` and
 * `skipLibCheck: true`.
 *
 * `pnpm test` builds before running, so this reads the freshly built output. `dist` is
 * not committed, so when it is absent there is nothing to check rather than something
 * to fail.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const built = existsSync(resolve(root, 'dist/index.d.ts'))

describe.skipIf(!built)('published package', () => {
    it('points every entry at a file the build emits', () => {
        const entries: string[] = [pkg.main, pkg.module, pkg.types, ...Object.values<string>(pkg.exports['.'])]
        for (const entry of entries) {
            expect(existsSync(resolve(root, entry)), entry).toBe(true)
        }
    })

    it('type-checks for a nodenext consumer', () => {
        // The consumer has its own package.json: inside this package's scope, Node's
        // self-reference would resolve `@volverjs/form-vue` to `../../../dist` instead of
        // the copy below, where a path into this repository's `node_modules` still works.
        const consumer = resolve(root, 'test-vitest/fixtures/nodenext-consumer')
        const installed = resolve(consumer, 'node_modules/@volverjs/form-vue')
        rmSync(installed, { recursive: true, force: true })
        mkdirSync(installed, { recursive: true })
        cpSync(resolve(root, 'package.json'), resolve(installed, 'package.json'))
        cpSync(resolve(root, 'dist'), resolve(installed, 'dist'), { recursive: true })

        let output = ''
        try {
            const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc')
            execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json', '--pretty', 'false'], {
                cwd: consumer,
                encoding: 'utf8',
            })
        }
        catch (error) {
            output = (error as { stdout: string }).stdout
        }
        finally {
            rmSync(resolve(consumer, 'node_modules'), { recursive: true, force: true })
        }

        // Only diagnostics in the consumer and in our copy count. Third-party declarations
        // resolve from outside the consumer (`../`), and some need globals a consumer opts
        // into: `@vueuse/core` expects `@types/web-bluetooth`, for one. Indented lines
        // continue the diagnostic above them.
        const ours = output.split('\n').filter(line => /^\S/.test(line) && !line.startsWith('..'))
        expect(ours).toEqual([])
    }, 60_000)
})
