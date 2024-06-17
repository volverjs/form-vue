import { z } from 'zod'
import { it, expect } from 'vitest'
// @ts-ignore
import { defaultObjectBySchema } from '../dist/index.es'

it('simple object', async () => {
    const schema = z.object({
        name: z.string(),
        surname: z.string(),
    })

    const defaultObject = defaultObjectBySchema(schema)

    expect(defaultObject).toStrictEqual({ name: undefined, surname: undefined })
})

it('object with defaults', async () => {
    const schema = z.object({
        name: z.string().default(''),
        surname: z.string(),
        age: z.number().default(0),
    })

    const defaultObject = defaultObjectBySchema(schema)

    expect(defaultObject).toStrictEqual({
        name: '',
        surname: undefined,
        age: 0,
    })
})

it('nested object', async () => {
    const schema = z.object({
        name: z.string().default(''),
        surname: z.string(),
        address: z.object({
            city: z.string(),
            country: z.string(),
        }),
    })

    const defaultObject = defaultObjectBySchema(schema)

    expect(defaultObject).toStrictEqual({
        name: '',
        surname: undefined,
        address: {
            city: undefined,
            country: undefined,
        },
    })
})

it('nested object with defaults', async () => {
    const schema = z.object({
        name: z.string().default(''),
        surname: z.string(),
        address: z.object({
            city: z.string().default(''),
            country: z.string(),
        }),
    })

    const defaultObject = defaultObjectBySchema(schema)

    expect(defaultObject).toStrictEqual({
        name: '',
        surname: undefined,
        address: {
            city: '',
            country: undefined,
        },
    })
})

it('keep original value', async () => {
    const schema = z.object({
        name: z.string(),
    })

    const defaultObject = defaultObjectBySchema(schema, { name: 'John' })

    expect(defaultObject).toStrictEqual({ name: 'John' })
})

it('wrong original type to undefined', async () => {
    const schema = z.object({
        name: z.string(),
    })

    const defaultObject = defaultObjectBySchema(schema, { name: 1 })

    expect(defaultObject).toStrictEqual({ name: undefined })
})

it('not nullable', async () => {
    const schema = z.object({
        name: z.string(),
    })

    const defaultObject = defaultObjectBySchema(schema, { name: null })

    expect(defaultObject).toStrictEqual({ name: undefined })
})

it('nullable', async () => {
    const schema = z.object({
        name: z.string().nullable(),
    })

    const defaultObject = defaultObjectBySchema(schema, { name: null })

    expect(defaultObject).toStrictEqual({ name: null })
})

it('coerce to type string', async () => {
    const schema = z.object({
        name: z.coerce.string(),
    })

    const defaultObject = defaultObjectBySchema(schema, { name: 1138 })

    expect(defaultObject).toStrictEqual({ name: '1138' })
})

it('coerce to type number', async () => {
    const schema = z.object({
        age: z.coerce.number(),
    })

    const defaultObject = defaultObjectBySchema(schema, { age: '22' })

    expect(defaultObject).toStrictEqual({ age: 22 })
})

it('coerce to type number without default', async () => {
    const schema = z.object({
        age: z.coerce.number(),
    })

    const defaultObject = defaultObjectBySchema(schema, { age: 'John' })

    expect(defaultObject).toStrictEqual({ age: undefined })
})

it('coerce to type number with default', async () => {
    const schema = z.object({
        age: z.coerce.number().default(0),
    })

    const defaultObject = defaultObjectBySchema(schema, { age: 'John' })

    expect(defaultObject).toStrictEqual({ age: 0 })
})

it('strip', async () => {
    const schema = z.object({
        name: z.string(),
        surname: z.string(),
    })

    const defaultObject = defaultObjectBySchema(schema, { age: 21 })
    expect(defaultObject).toStrictEqual({
        name: undefined,
        surname: undefined,
    })
})

it('passthrough', async () => {
    const schema = z
        .object({
            name: z.string(),
            surname: z.string(),
        })
        .passthrough()

    const defaultObject = defaultObjectBySchema(schema, { age: 21 })

    expect(defaultObject).toStrictEqual({
        name: undefined,
        surname: undefined,
        age: 21,
    })
})

it('optional', async () => {
    const schema = z.object({
        name: z.string(),
        surname: z.string(),
        location: z.object({
            city: z.string().optional(),
            address: z.object({
                street: z
                    .object({
                        name: z.string().optional(),
                        number: z.number().optional(),
                    })
                    .optional(),
            }),
        }),
    })

    const defaultObject = defaultObjectBySchema(schema, {
        name: 'John',
        location: {
            city: 'Verona',
            address: { street: { name: null, number: 1 } },
        },
    })
    expect(defaultObject).toStrictEqual({
        name: 'John',
        surname: undefined,
        location: {
            city: 'Verona',
            address: { street: { name: undefined, number: 1 } },
        },
    })
})
