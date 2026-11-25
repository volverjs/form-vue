import { z as z3 } from 'zod/v3'
import * as z4 from 'zod/v4'
import { it, expectTypeOf } from 'vitest'
import type { InferSchema } from '../src/types'

/**
 * Type-level checks, run by `pnpm type-check`: `VvFormField` types its `name` from
 * `InferSchema`, so a schema it does not recognise leaves the fields with no valid name.
 */

it('infers a Zod 3 object behind a preprocess', () => {
    const schema = z3.preprocess(value => value, z3.object({ email: z3.string() }))
    expectTypeOf<InferSchema<typeof schema>>().toEqualTypeOf<{ email: string }>()
})

it('infers a Zod 3 object behind a superRefine', () => {
    const schema = z3.object({ email: z3.string() }).superRefine(() => {})
    expectTypeOf<InferSchema<typeof schema>>().toEqualTypeOf<{ email: string }>()
})

it('infers a Zod 4 object behind a preprocess', () => {
    const schema = z4.preprocess(value => value, z4.object({ email: z4.string() }))
    expectTypeOf<InferSchema<typeof schema>>().toEqualTypeOf<{ email: string }>()
})
