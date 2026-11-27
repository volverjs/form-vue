import * as z4 from 'zod/v4'
import { describe, it, expectTypeOf } from 'vitest'
import type {
    FormComposableOptions,
    FormPluginOptions,
    InferFormattedError,
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
