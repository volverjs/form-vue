/// <reference types="node" />
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { it, expect, describe, beforeAll, afterAll } from 'vitest'

/**
 * Checks the package as consumers install it, not as this repository compiles it: the
 * declarations once shipped extensionless relative imports, a relative path into this
 * repository's `node_modules` and type parameters they never declared, and `require()`
 * returned an empty module. None of that showed up here, because `src/` compiles with
 * `moduleResolution: "bundler"` and `skipLibCheck: true`, and the tests import `src/`.
 *
 * `pnpm test` builds before running, so this reads the freshly built output. `dist` is
 * not committed, so when it is absent there is nothing to check rather than something
 * to fail.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const built = existsSync(resolve(root, 'dist'))

// The consumer has its own package.json: inside this package's scope, Node's
// self-reference would resolve `@volverjs/form-vue` to `../../../dist` instead of the
// copy installed below, where a path into this repository's `node_modules` still works.
const consumer = resolve(root, 'test-vitest/fixtures/consumer')

/** Every file path an `exports` entry can resolve to, through nested conditions. */
function targets(entry: unknown): string[] {
    if (typeof entry === 'string') {
        return [entry]
    }
    return entry && typeof entry === 'object' ? Object.values(entry).flatMap(targets) : []
}

/** Runs `tsc` on a consumer project and returns the diagnostics that concern us. */
function typeCheck(project: string): string[] {
    let output = ''
    try {
        const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc')
        execFileSync(process.execPath, [tsc, '-p', project, '--pretty', 'false'], {
            cwd: consumer,
            encoding: 'utf8',
        })
    }
    catch (error) {
        output = (error as { stdout: string }).stdout
    }
    // Only diagnostics in the consumer and in our copy count. Third-party declarations
    // resolve from outside the consumer (`../`), and some need globals a consumer opts
    // into: `@vueuse/core` expects `@types/web-bluetooth`, for one. Indented lines
    // continue the diagnostic above them.
    return output.split('\n').filter(line => /^\S/.test(line) && !line.startsWith('..'))
}

/** The relative specifiers of the declaration files with the given extension. */
function specifiers(extension: string): string[] {
    return readdirSync(resolve(root, 'dist'))
        .filter(file => file.endsWith(extension))
        .flatMap(file => [...readFileSync(resolve(root, 'dist', file), 'utf8').matchAll(/['"](\.\.?\/[^'"]+)['"]/g)]
            .map(match => match[1]))
}

describe.skipIf(!built)('published package', () => {
    beforeAll(() => {
        const installed = resolve(consumer, 'node_modules/@volverjs/form-vue')
        rmSync(installed, { recursive: true, force: true })
        mkdirSync(installed, { recursive: true })
        cpSync(resolve(root, 'package.json'), resolve(installed, 'package.json'))
        cpSync(resolve(root, 'dist'), resolve(installed, 'dist'), { recursive: true })
    })

    afterAll(() => {
        rmSync(resolve(consumer, 'node_modules'), { recursive: true, force: true })
    })

    it('points every entry at a file the build emits', () => {
        const entries = [pkg.main, pkg.module, pkg.types, pkg.unpkg, pkg.jsdelivr, ...targets(pkg.exports['.'])]
        for (const entry of entries) {
            expect(existsSync(resolve(root, entry)), entry).toBe(true)
        }
    })

    it('keeps the ES module and CommonJS declarations apart', () => {
        // A `.d.cts` file reaching into a `.d.ts` one would mix the two trees: the
        // `FormFieldType` enum from each is a distinct type.
        expect(specifiers('.d.ts').filter(specifier => !specifier.endsWith('.js'))).toEqual([])
        expect(specifiers('.d.cts').filter(specifier => !specifier.endsWith('.cjs'))).toEqual([])
    })

    it('type-checks for an ES module consumer (nodenext)', () => {
        expect(typeCheck('tsconfig.esm.json')).toEqual([])
    }, 60_000)

    it('type-checks for a CommonJS consumer (node16)', () => {
        expect(typeCheck('tsconfig.cjs.json')).toEqual([])
    }, 60_000)

    it('passes arethetypeswrong under every module resolution', () => {
        // Packs the package and checks how TypeScript resolves it under node10, node16
        // (from CommonJS and from ES modules) and bundler, including the modes the
        // consumer fixture does not cover. Run against published versions, it reports
        // an internal resolution error for 1.1.7 (#132) and a `require()` resolving to
        // an ES module for 1.1.7 and 1.1.8 (#136).
        const manifest = createRequire(import.meta.url).resolve('@arethetypeswrong/cli/package.json')
        const attw = resolve(dirname(manifest), JSON.parse(readFileSync(manifest, 'utf8')).bin.attw)
        const result = spawnSync(process.execPath, [attw, '--pack', '.', '--format', 'ascii', '--no-color'], {
            cwd: root,
            encoding: 'utf8',
        })
        expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)
    }, 60_000)

    it('returns the exports from require()', async () => {
        const output = execFileSync(process.execPath, ['require.cjs'], { cwd: consumer, encoding: 'utf8' })
        expect(JSON.parse(output)).toEqual({
            exports: Object.keys(await import('../src/index')).sort(),
            global: 'undefined',
        })
    })
})
