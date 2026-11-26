import { z as z3 } from 'zod/v3'
import * as z4 from 'zod/v4'
import { describe, it, expectTypeOf } from 'vitest'
import type { FormPluginOptions, InferFormattedError, InferSchema, Path } from '../src/types'

/**
 * Type-level checks, run by `pnpm type-check`: `VvFormField` types its `name` from
 * `InferSchema`, so a schema it does not recognise leaves the fields with no valid name.
 */

type Data = { email: string }

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

describe('a Zod 3 schema', () => {
    const object = z3.object({ email: z3.string() })

    it('gives the fields of a preprocess their names', () => {
        const schema = z3.preprocess(value => value, object)
        expectTypeOf<Path<InferSchema<typeof schema>>>().toEqualTypeOf<'email'>()
    })

    it('is inferred through the wrappers matched before', () => {
        expectTypeOf<InferSchema<typeof object>>().toEqualTypeOf<Data>()
        const optional = object.optional()
        expectTypeOf<InferSchema<typeof optional>>().toEqualTypeOf<Data | undefined>()
        const nullable = object.nullable()
        expectTypeOf<InferSchema<typeof nullable>>().toEqualTypeOf<Data | null>()
        const withDefault = object.default({ email: '' })
        expectTypeOf<InferSchema<typeof withDefault>>().toEqualTypeOf<Data>()
        const refined = object.refine(() => true).refine(() => true)
        expectTypeOf<InferSchema<typeof refined>>().toEqualTypeOf<Data>()
        const transformed = object.transform(value => ({ ...value, extra: 1 }))
        expectTypeOf<InferSchema<typeof transformed>>().toEqualTypeOf<{ email: string, extra: number }>()
    })

    it('is inferred through the wrappers that read as unknown', () => {
        const optionalPreprocess = z3.preprocess(value => value, object).optional()
        expectTypeOf<InferSchema<typeof optionalPreprocess>>().toEqualTypeOf<Data | undefined>()
        const optionalRefine = object.refine(() => true).optional()
        expectTypeOf<InferSchema<typeof optionalRefine>>().toEqualTypeOf<Data | undefined>()
        const piped = object.pipe(object)
        expectTypeOf<InferSchema<typeof piped>>().toEqualTypeOf<Data>()
        const caught = object.catch({ email: '' })
        expectTypeOf<InferSchema<typeof caught>>().toEqualTypeOf<Data>()
        const lazy = z3.lazy(() => object)
        expectTypeOf<InferSchema<typeof lazy>>().toEqualTypeOf<Data>()
        const branded = object.brand<'Login'>()
        expectTypeOf<InferSchema<typeof branded>>().toEqualTypeOf<Data & z3.BRAND<'Login'>>()
        const frozen = object.readonly()
        expectTypeOf<InferSchema<typeof frozen>>().toEqualTypeOf<Readonly<Data>>()
        const union = z3.union([object, z3.object({ phone: z3.string() })])
        expectTypeOf<InferSchema<typeof union>>().toEqualTypeOf<Data | { phone: string }>()
        const annotated: z3.ZodType<Data> = object
        expectTypeOf<InferSchema<typeof annotated>>().toEqualTypeOf<Data>()
    })

    it('types the formatted errors of a preprocess by its fields', () => {
        const schema = z3.preprocess(value => value, object)
        expectTypeOf<InferFormattedError<typeof schema>>().toEqualTypeOf<z3.ZodFormattedError<Data>>()
    })
})

describe('a Zod 4 schema', () => {
    const object = z4.object({ email: z4.string() })

    it('is inferred through its wrappers', () => {
        const optional = object.optional()
        expectTypeOf<InferSchema<typeof optional>>().toEqualTypeOf<Data | undefined>()
        const refined = object.superRefine(() => {})
        expectTypeOf<InferSchema<typeof refined>>().toEqualTypeOf<Data>()
        const piped = object.pipe(object)
        expectTypeOf<InferSchema<typeof piped>>().toEqualTypeOf<Data>()
        const transformed = object.transform(value => value)
        expectTypeOf<InferSchema<typeof transformed>>().toEqualTypeOf<Data>()
    })
})

it('keeps the data of the createForm() factory unknown', () => {
    // Zod 3 infers `any` from a bare `ZodTypeAny`, and `Partial<any>` would reject a
    // factory that returns a primitive, which `Partial<unknown>` (`{}`) accepts.
    expectTypeOf<NonNullable<FormPluginOptions['factory']>>()
        .toEqualTypeOf<(data?: Partial<unknown>) => Partial<unknown>>()
})
