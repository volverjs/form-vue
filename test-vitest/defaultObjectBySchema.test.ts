import { z as z3 } from 'zod/v3'
import * as z4 from 'zod/v4'
import { it, expect } from 'vitest'
import { defaultObjectBySchema } from '../src/utils'

it('simple object', async () => {
    const schema3 = z3.object({
        name: z3.string(),
        surname: z3.string(),
    })
    const schema4 = z4.object({
        name: z4.string(),
        surname: z4.string(),
    })
    const expectedResult = { name: undefined, surname: undefined }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3)
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4)
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('object with defaults', async () => {
    const schema3 = z3.object({
        name: z3.string().default(''),
        surname: z3.string(),
        age: z3.number().default(0),
    })
    const schema4 = z4.object({
        name: z4.string().default(''),
        surname: z4.string(),
        age: z4.number().default(0),
    })
    const expectedResult = {
        name: '',
        surname: undefined,
        age: 0,
    }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3)
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4)
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('nested object', async () => {
    const schema3 = z3.object({
        name: z3.string().default(''),
        surname: z3.string(),
        address: z3.object({
            city: z3.string(),
            country: z3.string(),
        }),
    })
    const schema4 = z4.object({
        name: z4.string().default(''),
        surname: z4.string(),
        address: z4.object({
            city: z4.string(),
            country: z4.string(),
        }),
    })
    const expectedResult = {
        name: '',
        surname: undefined,
        address: {
            city: undefined,
            country: undefined,
        },
    }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3)
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4)
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('nested object with defaults', async () => {
    const schema3 = z3.object({
        name: z3.string().default(''),
        surname: z3.string(),
        address: z3.object({
            city: z3.string().default(''),
            country: z3.string(),
        }),
    })
    const schema4 = z4.object({
        name: z4.string().default(''),
        surname: z4.string(),
        address: z4.object({
            city: z4.string().default(''),
            country: z4.string(),
        }),
    })
    const expectedResult = {
        name: '',
        surname: undefined,
        address: {
            city: '',
            country: undefined,
        },
    }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3)
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4)
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('keep original value', async () => {
    const schema3 = z3.object({
        name: z3.string(),
    })
    const schema4 = z4.object({
        name: z4.string(),
    })
    const expectedResult = { name: 'John' }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3, { name: 'John' })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4, { name: 'John' })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('wrong original type to undefined', async () => {
    const schema3 = z3.object({
        name: z3.string(),
    })
    const schema4 = z4.object({
        name: z4.string(),
    })
    const expectedResult = { name: undefined }
    // Test with zod v3
    // @ts-expect-error for testing purposes
    const defaultObject3 = defaultObjectBySchema(schema3, { name: 1 })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    // @ts-expect-error for testing purposes
    const defaultObject4 = defaultObjectBySchema(schema4, { name: 1 })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('not nullable', async () => {
    const schema3 = z3.object({
        name: z3.string(),
    })
    const schema4 = z4.object({
        name: z4.string(),
    })
    const expectedResult = { name: undefined }
    // Test with zod v3
    // @ts-expect-error for testing purposes
    const defaultObject3 = defaultObjectBySchema(schema3, { name: null })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    // @ts-expect-error for testing purposes
    const defaultObject4 = defaultObjectBySchema(schema4, { name: null })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('nullable', async () => {
    const schema3 = z3.object({
        name: z3.string().nullable(),
    })
    const schema4 = z4.object({
        name: z4.string().nullable(),
    })
    const expectedResult = { name: null }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3, { name: null })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4, { name: null })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('coerce to type string', async () => {
    const schema3 = z3.object({
        name: z3.coerce.string(),
    })
    const schema4 = z4.object({
        name: z4.coerce.string(),
    })
    const expectedResult = { name: '1138' }
    // Test with zod v3
    // @ts-expect-error for testing purposes
    const defaultObject3 = defaultObjectBySchema(schema3, { name: 1138 })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    // @ts-expect-error for testing purposes
    const defaultObject4 = defaultObjectBySchema(schema4, { name: 1138 })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('coerce to type number', async () => {
    const schema3 = z3.object({
        age: z3.coerce.number(),
    })
    const schema4 = z4.object({
        age: z4.coerce.number(),
    })
    const expectedResult = { age: 22 }
    // Test with zod v3
    // @ts-expect-error for testing purposes
    const defaultObject3 = defaultObjectBySchema(schema3, { age: '22' })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    // @ts-expect-error for testing purposes
    const defaultObject4 = defaultObjectBySchema(schema4, { age: '22' })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('coerce to type number without default', async () => {
    const schema3 = z3.object({
        age: z3.coerce.number(),
    })
    const schema4 = z4.object({
        age: z4.coerce.number(),
    })
    const expectedResult = { age: undefined }
    // Test with zod v3
    // @ts-expect-error for testing purposes
    const defaultObject3 = defaultObjectBySchema(schema3, { age: 'John' })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    // @ts-expect-error for testing purposes
    const defaultObject4 = defaultObjectBySchema(schema4, { age: 'John' })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('coerce to type number with default', async () => {
    const schema3 = z3.object({
        age: z3.coerce.number().default(0),
    })
    const schema4 = z4.object({
        age: z4.coerce.number().default(0),
    })
    const expectedResult = { age: 0 }
    // Test with zod v3
    // @ts-expect-error for testing purposes
    const defaultObject3 = defaultObjectBySchema(schema3, { age: 'John' })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    // @ts-expect-error for testing purposes
    const defaultObject4 = defaultObjectBySchema(schema4, { age: 'John' })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('strip', async () => {
    const schema3 = z3.object({
        name: z3.string(),
        surname: z3.string(),
    })
    const schema4 = z4.object({
        name: z4.string(),
        surname: z4.string(),
    })
    const expectedResult = {
        name: undefined,
        surname: undefined,
    }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3, { age: 21 })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4, { age: 21 })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('passthrough', async () => {
    const schema3 = z3
        .object({
            name: z3.string(),
            surname: z3.string(),
        })
        .passthrough()
    const schema4 = z4
        .looseObject({
            name: z4.string(),
            surname: z4.string(),
        })
    const expectedResult = {
        name: undefined,
        surname: undefined,
        age: 21,
    }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3, { age: 21 })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4, { age: 21 })
    expect(defaultObject4).toStrictEqual(expectedResult)
})

it('optional', async () => {
    const schema3 = z3.object({
        name: z3.string(),
        surname: z3.string(),
        location: z3.object({
            city: z3.string().optional(),
            address: z3.object({
                street: z3
                    .object({
                        name: z3.string().optional(),
                        number: z3.number().optional(),
                    })
                    .optional(),
            }),
        }),
    })
    const schema4 = z4.object({
        name: z4.string(),
        surname: z4.string(),
        location: z4.object({
            city: z4.string().optional(),
            address: z4.object({
                street: z4
                    .object({
                        name: z4.string().optional(),
                        number: z4.number().optional(),
                    })
                    .optional(),
            }),
        }),
    })
    const expectedResult = {
        name: 'John',
        surname: undefined,
        location: {
            city: 'Verona',
            address: { street: { name: undefined, number: 1 } },
        },
    }
    // Test with zod v3
    const defaultObject3 = defaultObjectBySchema(schema3, {
        name: 'John',
        location: {
            city: 'Verona',
            // @ts-expect-error for testing purposes
            address: { street: { name: null, number: 1 } },
        },
    })
    expect(defaultObject3).toStrictEqual(expectedResult)
    
    // Test with zod v4
    const defaultObject4 = defaultObjectBySchema(schema4, {
        name: 'John',
        location: {
            city: 'Verona',
            // @ts-expect-error for testing purposes
            address: { street: { name: null, number: 1 } },
        },
    })
    expect(defaultObject4).toStrictEqual(expectedResult)
})
