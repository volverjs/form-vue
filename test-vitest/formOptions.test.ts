import { z as z3 } from 'zod/v3'
import * as z4 from 'zod/v4'
import * as zMini from 'zod/mini'
import { describe, it, expectTypeOf } from 'vitest'
import { formatError } from '../src/utils'
import type {
    FormComposableOptions,
    FormPluginOptions,
    InferFormattedError,
    RefinementCtx,
    SuperRefine,
    VvZodError,
} from '../src/types'

/**
 * Type-level checks, run by `pnpm type-check` (locally and in CI), since `vitest run`
 * treats `expectTypeOf` as a no-op. An unannotated callback that gets an implicit `any`
 * fails `tsc` here as well, since the project is type-checked with `strict`.
 */

type Data = { email: string }

class User {
    email?: string
    constructor(data?: Partial<Data>) {
        Object.assign(this, data)
    }
}

describe('the options of createForm()', () => {
    it('accept a class, as useForm() does', () => {
        expectTypeOf<typeof User>().toExtend<NonNullable<FormPluginOptions['class']>>()
        const anyData = class {
            constructor(data?: any) {
                Object.assign(this, data)
            }
        }
        expectTypeOf<typeof anyData>().toExtend<NonNullable<FormPluginOptions['class']>>()
    })

    it('type the parameters of unannotated callbacks', () => {
        const options: FormPluginOptions = {
            onInvalid: (error) => {
                expectTypeOf(error).not.toBeAny()
                expectTypeOf<NonNullable<typeof error>['_errors']>().toEqualTypeOf<string[]>()
            },
            onSubmit: (data) => {
                expectTypeOf(data).toEqualTypeOf<Partial<any> | undefined>()
            },
        }
        expectTypeOf(options).toExtend<FormPluginOptions>()
    })
})

describe('the options of useForm() with a union of schemas', () => {
    const login = z4.object({ email: z4.string() })
    const phone = z4.object({ phone: z4.string() })

    it('type an unannotated callback with the data of either schema', () => {
        const options: FormComposableOptions<typeof login | typeof phone, undefined> = {
            onSubmit: (data) => {
                expectTypeOf(data).toEqualTypeOf<Partial<Data> | Partial<{ phone: string }> | undefined>()
            },
            onInvalid: (error) => {
                expectTypeOf(error).toEqualTypeOf<InferFormattedError<typeof login | typeof phone> | undefined>()
            },
        }
        expectTypeOf(options).not.toBeAny()
    })
})

describe('the context of a superRefine', () => {
    const object3 = z3.object({ email: z3.string() })
    const object4 = z4.object({ email: z4.string() })

    it('is the Zod 3 context for a Zod 3 schema', () => {
        expectTypeOf<RefinementCtx<typeof object3>>().toEqualTypeOf<z3.RefinementCtx>()
        expectTypeOf<(value: Data, ctx: z3.RefinementCtx) => void>().toExtend<SuperRefine<typeof object3>>()
    })

    it('is the Zod 4 context built on the data for a Zod 4 schema', () => {
        expectTypeOf<RefinementCtx<typeof object4>>().toEqualTypeOf<z4.RefinementCtx<Data>>()
        expectTypeOf<RefinementCtx<typeof object4>['value']>().toEqualTypeOf<Data>()
        expectTypeOf<(value: Data, ctx: z4.RefinementCtx) => void>().toExtend<SuperRefine<typeof object4>>()
        const mini = zMini.object({ email: zMini.string() })
        expectTypeOf<RefinementCtx<typeof mini>['value']>().toEqualTypeOf<Data>()
    })
})

describe('the parse error', () => {
    const object3 = z3.object({ email: z3.string() })
    const object4 = z4.object({ email: z4.string() })

    it('is typed by the parsed data', () => {
        expectTypeOf<VvZodError<typeof object3>>().toEqualTypeOf<z3.ZodError<Data>>()
        expectTypeOf<VvZodError<typeof object4>>().toEqualTypeOf<z4.core.$ZodError<Data>>()
    })

    it('is the one of the schema\'s Zod version when formatted', () => {
        expectTypeOf(formatError<typeof object3>).parameter(1).toEqualTypeOf<z3.ZodError<Data>>()
        expectTypeOf(formatError<typeof object4>).returns.toEqualTypeOf<InferFormattedError<typeof object4>>()
    })
})
