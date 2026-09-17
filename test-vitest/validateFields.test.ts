import { z as z3 } from 'zod/v3'
import * as z4 from 'zod/v4'
import { it, expect, describe } from 'vitest'
import { useForm } from '../src/index'
import { FormStatus } from '../src/enums'

/**
 * Characterization tests for the `validateFields` path, which formats a subset of
 * the parse issues through `formatIssues`. They pin the shape of the formatted
 * error tree so that changing how the tree is built cannot silently alter it.
 */

const data = {
    name: 'a',
    nested: { city: 'b' },
    union: true,
    list: [{ label: 'c' }],
    ok: 'fine',
}

const schemas = {
    'zod 3': z3.object({
        name: z3.string().min(2),
        nested: z3.object({ city: z3.string().min(2) }),
        union: z3.union([z3.string(), z3.number()]),
        list: z3.array(z3.object({ label: z3.string().min(2) })),
        ok: z3.string(),
    }),
    'zod 4': z4.object({
        name: z4.string().min(2),
        nested: z4.object({ city: z4.string().min(2) }),
        union: z4.union([z4.string(), z4.number()]),
        list: z4.array(z4.object({ label: z4.string().min(2) })),
        ok: z4.string(),
    }),
} as const

// Message wording differs between the two Zod versions, so the expected trees
// are parameterized on the messages each version produces.
const messages = {
    'zod 3': {
        tooSmall: 'String must contain at least 2 character(s)',
        union: ['Expected string, received boolean', 'Expected number, received boolean'],
    },
    'zod 4': {
        tooSmall: 'Too small: expected string to have >=2 characters',
        union: ['Invalid input: expected string, received boolean', 'Invalid input: expected number, received boolean'],
    },
} as const

describe.each(Object.keys(schemas) as (keyof typeof schemas)[])('%s', (version) => {
    const schema = schemas[version]
    const { tooSmall, union } = messages[version]

    it('formats every issue when no fields are given', async () => {
        const form = useForm(schema as never)
        expect(await form.validate(data as never)).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            name: { _errors: [tooSmall] },
            nested: { _errors: [], city: { _errors: [tooSmall] } },
            union: { _errors: union },
            list: { '_errors': [], '0': { _errors: [], label: { _errors: [tooSmall] } } },
        })
    })

    it('keeps only the requested nested field', async () => {
        const form = useForm(schema as never)
        expect(await form.validate(data as never, { fields: new Set(['nested.city']) as never })).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            nested: { _errors: [], city: { _errors: [tooSmall] } },
        })
    })

    it('keeps only the requested array element field', async () => {
        const form = useForm(schema as never)
        expect(await form.validate(data as never, { fields: new Set(['list.0.label']) as never })).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            list: { '_errors': [], '0': { _errors: [], label: { _errors: [tooSmall] } } },
        })
    })

    it('keeps every message of a union on the requested field', async () => {
        const form = useForm(schema as never)
        expect(await form.validate(data as never, { fields: new Set(['union']) as never })).toBe(false)
        expect(form.errors.value).toEqual({
            _errors: [],
            union: { _errors: union },
        })
    })

    it('reports no error and does not stay invalid when no issue matches', async () => {
        const form = useForm(schema as never)

        // Start from an invalid form, so that clearing the state is what is observed
        // rather than a form that was never invalid to begin with.
        expect(await form.validate(data as never)).toBe(false)
        expect(form.invalid.value).toBe(true)

        expect(await form.validate(data as never, { fields: new Set(['ok']) as never })).toBe(true)
        expect(form.errors.value).toBeUndefined()
        expect(form.invalid.value).toBe(false)
        // Exactly `unknown`, not `valid`: the schema as a whole is still invalid, so
        // claiming `valid` here would emit `valid` and `update:modelValue` for data
        // that was never re-parsed.
        expect(form.status.value).toBe(FormStatus.unknown)
    })
})
