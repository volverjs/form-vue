import { z as z3 } from 'zod/v3'
import * as z4 from 'zod/v4'
import * as zMini from 'zod/mini'
import * as zCore from 'zod/v4/core'
import { it, expect, describe, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useForm } from '../src/index'
import { withSuperRefine } from '../src/utils'

/**
 * `superRefine` can be passed per call to `validate()` / `submit()` and as a prop of
 * `VvForm`, on top of whatever the schema already declares. These tests cover the
 * three schema flavours the library accepts, because they do not all attach a
 * refinement the same way: classic Zod 4 has `.superRefine()`, `@zod/mini` and bare
 * core schemas only have `.check()`, and Zod 3 has neither of the Zod 4 APIs.
 */

const matching = { password: 'secret', confirm: 'secret' }
const mismatching = { password: 'secret', confirm: 'other' }

const schemas = {
    'zod 3': z3.object({ password: z3.string(), confirm: z3.string() }),
    'zod 4': z4.object({ password: z4.string(), confirm: z4.string() }),
    'zod 4 mini': zMini.object({ password: zMini.string(), confirm: zMini.string() }),
} as const

// `ctx.addIssue` is shared by both versions, but Zod 3 wants its own issue code.
function mismatch(version: keyof typeof schemas) {
    const code = version === 'zod 3' ? z3.ZodIssueCode.custom : 'custom'
    return (value: { password: string, confirm: string }, ctx: { addIssue: (issue: unknown) => void }) => {
        if (value.password !== value.confirm) {
            ctx.addIssue({ code, message: 'Passwords do not match', path: ['confirm'] })
        }
    }
}

describe.each(Object.keys(schemas) as (keyof typeof schemas)[])('%s', (version) => {
    const schema = schemas[version]

    it('applies a superRefine passed to validate()', async () => {
        const form = useForm(schema as never)
        expect(await form.validate(mismatching as never, { superRefine: mismatch(version) as never })).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            confirm: { _errors: ['Passwords do not match'] },
        })
    })

    it('passes when the refinement is satisfied', async () => {
        const form = useForm(schema as never)
        expect(await form.validate(matching as never, { superRefine: mismatch(version) as never })).toBe(true)
        expect(form.errors.value).toBeUndefined()
    })

    it('applies an async superRefine', async () => {
        const form = useForm(schema as never)
        const asyncRefine = async (value: { password: string, confirm: string }, ctx: { addIssue: (issue: unknown) => void }) => {
            await Promise.resolve()
            mismatch(version)(value, ctx)
        }
        expect(await form.validate(mismatching as never, { superRefine: asyncRefine as never })).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            confirm: { _errors: ['Passwords do not match'] },
        })
    })

    it('leaves the original schema untouched', async () => {
        const form = useForm(schema as never)
        expect(await form.validate(mismatching as never, { superRefine: mismatch(version) as never })).toBe(false)
        // Same data, no refinement: the schema itself has nothing to complain about.
        expect(await form.validate(mismatching as never)).toBe(true)
        expect(form.errors.value).toBeUndefined()
    })

    it('still runs the refinement when a field only failed a check', async () => {
        const longEnough = {
            'zod 3': z3.object({ password: z3.string().min(5), confirm: z3.string() }),
            'zod 4': z4.object({ password: z4.string().min(5), confirm: z4.string() }),
            'zod 4 mini': zMini.object({ password: zMini.string().check(zMini.minLength(5)), confirm: zMini.string() }),
        }[version]
        const form = useForm(longEnough as never)
        expect(await form.validate({ password: 'ab', confirm: 'other' } as never, {
            superRefine: mismatch(version) as never,
        })).toBe(false)
        // Both the length error on `password` and the cross-field error on `confirm`.
        const errors = form.errors.value as unknown as Record<string, { _errors: string[] }>
        expect(errors.password._errors.length).toBeGreaterThan(0)
        expect(errors.confirm._errors).toEqual(['Passwords do not match'])
    })

    it('skips the refinement when a field failed its type check', async () => {
        // A type error aborts the parse of that field, and Zod does not run the
        // object-level checks afterwards. Cross-field errors are therefore invisible
        // until every field holds a value of the right type. Same on Zod 3 and Zod 4.
        const form = useForm(schema as never)
        const refine = vi.fn(mismatch(version))
        expect(await form.validate({ password: 1, confirm: 'other' } as never, {
            superRefine: refine as never,
        })).toBe(false)
        // The refinement was never invoked, not merely silent.
        expect(refine).not.toHaveBeenCalled()
        const errors = form.errors.value as unknown as Record<string, { _errors: string[] } | undefined>
        expect(errors.password?._errors.length).toBeGreaterThan(0)
        expect(errors.confirm).toBeUndefined()
    })

    it('composes with a refinement already declared on the schema', async () => {
        const refined = {
            'zod 3': z3.object({ password: z3.string(), confirm: z3.string() })
                .superRefine((value, ctx) => {
                    if (value.password === 'weak') {
                        ctx.addIssue({ code: z3.ZodIssueCode.custom, message: 'Too weak', path: ['password'] })
                    }
                }),
            'zod 4': z4.object({ password: z4.string(), confirm: z4.string() })
                .superRefine((value, ctx) => {
                    if (value.password === 'weak') {
                        ctx.addIssue({ code: 'custom', message: 'Too weak', path: ['password'] })
                    }
                }),
            'zod 4 mini': zMini.object({ password: zMini.string(), confirm: zMini.string() })
                .check(zMini.superRefine((value, ctx) => {
                    if (value.password === 'weak') {
                        ctx.addIssue({ code: 'custom', message: 'Too weak', path: ['password'] })
                    }
                })),
        }[version]
        const form = useForm(refined as never)
        expect(await form.validate({ password: 'weak', confirm: 'other' } as never, {
            superRefine: mismatch(version) as never,
        })).toBe(false)
        // Both the schema's own rule and the ad-hoc one.
        expect(form.errors.value).toEqual({
            _errors: [],
            password: { _errors: ['Too weak'] },
            confirm: { _errors: ['Passwords do not match'] },
        })
    })

    it('builds the refined schema once per refinement function and keeps applying it', async () => {
        const form = useForm(schema as never)
        const attach = version === 'zod 3' ? 'superRefine' : 'check'
        const spy = vi.spyOn(schema as unknown as Record<string, () => unknown>, attach)
        const superRefine = mismatch(version) as never

        expect(await form.validate(mismatching as never, { superRefine })).toBe(false)
        expect(await form.validate(matching as never, { superRefine })).toBe(true)
        // The refinement must still be attached on the reused schema: a cache that
        // handed back the original schema after the first call would also report a
        // single attachment, but would stop catching the mismatch here.
        expect(await form.validate(mismatching as never, { superRefine })).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            confirm: { _errors: ['Passwords do not match'] },
        })

        expect(spy).toHaveBeenCalledTimes(1)
        spy.mockRestore()
    })

    it('builds a separate schema for a different refinement function', async () => {
        const form = useForm(schema as never)
        const first = mismatch(version) as never
        const second = ((value: { password: string }, ctx: { addIssue: (issue: unknown) => void }) => {
            if (value.password === 'secret') {
                ctx.addIssue({
                    code: version === 'zod 3' ? z3.ZodIssueCode.custom : 'custom',
                    message: 'Too obvious',
                    path: ['password'],
                })
            }
        }) as never

        expect(await form.validate(mismatching as never, { superRefine: first })).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            confirm: { _errors: ['Passwords do not match'] },
        })
        expect(await form.validate(mismatching as never, { superRefine: second })).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            password: { _errors: ['Too obvious'] },
        })
        // Dropping the option goes back to the bare schema.
        expect(await form.validate(mismatching as never)).toBe(true)
    })
})

it('explains itself when the schema comes straight from zod/v4/core', () => {
    // A bare core schema parses fine through the library, but has no `.check()` to
    // attach a refinement to. That must read as a usable message, not as
    // "undefined is not a function".
    const bare = new zCore.$ZodObject({
        type: 'object',
        shape: { password: new zCore.$ZodString({ type: 'string' }) },
    })
    expect(typeof (bare as unknown as { check?: unknown }).check).toBe('undefined')
    expect(() => withSuperRefine(bare as never, (() => {}) as never)).toThrow(/zod\/mini/)
    // Without a refinement there is nothing to attach, so the schema passes through.
    expect(withSuperRefine(bare as never)).toBe(bare)
})

it('forwards the superRefine prop to the validate it exposes and provides', async () => {
    // The prop used to reach only the native submit and the continuous-validation
    // watcher, so a consumer calling the exposed `validate()` — or `VvFormWrapper`
    // calling the provided one — silently validated without the refinement.
    const { VvForm } = useForm(
        z4.object({ password: z4.string(), confirm: z4.string() }),
        { lazyLoad: true },
    )
    const wrapper = mount(VvForm, {
        props: {
            modelValue: mismatching,
            superRefine: mismatch('zod 4') as never,
        },
    })

    const vm = wrapper.vm as unknown as {
        validate: (value?: unknown, options?: unknown) => Promise<boolean>
        errors: { _errors: string[], confirm?: { _errors: string[] } } | undefined
    }
    expect(await vm.validate()).toBe(false)
    expect(vm.errors?.confirm?._errors).toEqual(['Passwords do not match'])

    wrapper.unmount()
})

it('lets an explicit superRefine argument win over the prop', async () => {
    const { VvForm } = useForm(
        z4.object({ password: z4.string(), confirm: z4.string() }),
        { lazyLoad: true },
    )
    const wrapper = mount(VvForm, {
        props: {
            modelValue: mismatching,
            superRefine: mismatch('zod 4') as never,
        },
    })

    const vm = wrapper.vm as unknown as {
        validate: (value?: unknown, options?: unknown) => Promise<boolean>
        errors: { password?: { _errors: string[] }, confirm?: { _errors: string[] } } | undefined
    }
    expect(await vm.validate(undefined, {
        superRefine: (value: { password: string }, ctx: { addIssue: (issue: unknown) => void }) => {
            if (value.password === 'secret') {
                ctx.addIssue({ code: 'custom', message: 'Too obvious', path: ['password'] })
            }
        },
    })).toBe(false)
    expect(vm.errors?.password?._errors).toEqual(['Too obvious'])
    expect(vm.errors?.confirm).toBeUndefined()

    wrapper.unmount()
})
