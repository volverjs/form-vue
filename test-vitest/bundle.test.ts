import { it, expect, describe } from 'vitest'

/**
 * Zod 3 is supported without importing it, so that consumers on Zod 4 do not pull the
 * Zod 3 runtime into their bundle, and so that the CJS and UMD builds do not hard-require
 * the `zod/v3` subpath (a `require("zod/v3")` there runs at load time, and the UMD build
 * would also ask for a `zodV3` global that a Zod 4 consumer does not have).
 *
 * `pnpm test` builds before running, so this reads the freshly built output. `dist` is
 * not committed, so when it is absent — `pnpm run test:unit` on a fresh clone — there is
 * nothing to check rather than something to fail.
 */

const bundles = import.meta.glob('../dist/index.{es,umd}.js', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>

const built = Object.keys(bundles)

describe.skipIf(built.length === 0)('built bundles', () => {
    it('builds both the es and the umd output', () => {
        expect(built).toHaveLength(2)
    })

    it.each(built)('%s imports zod through zod/v4/core only', (bundle) => {
        // The positive half matters as much as the negative one: without it an empty
        // or unrelated file would pass the `zod/v3` check by having no imports at all.
        expect(bundles[bundle]).toContain('zod/v4/core')
        expect(bundles[bundle]).not.toContain('zod/v3')
    })
})
