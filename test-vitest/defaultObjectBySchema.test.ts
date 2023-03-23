import { defaultObjectBySchema } from '../dist/index.es.js'
import { z } from 'zod'
import { it, expect } from 'vitest'

it('Simple object', async () => {
	const schema = z.object({
		name: z.string(),
		surname: z.string(),
	})

	const defaultObject = defaultObjectBySchema(schema)

	expect(defaultObject).toStrictEqual({ name: undefined, surname: undefined })
})

it('Object with defaults', async () => {
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

it('Nested object', async () => {
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

it('Nested object with defaults', async () => {
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

it('Keep original value', async () => {
	const schema = z.object({
		name: z.string(),
	})

	const defaultObject = defaultObjectBySchema(schema, { name: 'John' })

	expect(defaultObject).toStrictEqual({ name: 'John' })
})

it('Wrong original type to undefined', async () => {
	const schema = z.object({
		name: z.string(),
	})

	const defaultObject = defaultObjectBySchema(schema, { name: 1 })

	expect(defaultObject).toStrictEqual({ name: undefined })
})

it('Not nullable', async () => {
	const schema = z.object({
		name: z.string(),
	})

	const defaultObject = defaultObjectBySchema(schema, { name: null })

	expect(defaultObject).toStrictEqual({ name: undefined })
})

it('Nullable', async () => {
	const schema = z.object({
		name: z.string().nullable(),
	})

	const defaultObject = defaultObjectBySchema(schema, { name: null })

	expect(defaultObject).toStrictEqual({ name: null })
})

it('Coerce to type string', async () => {
	const schema = z.object({
		name: z.coerce.string(),
	})

	const defaultObject = defaultObjectBySchema(schema, { name: 1138 })

	expect(defaultObject).toStrictEqual({ name: '1138' })
})

it('Coerce to type number', async () => {
	const schema = z.object({
		age: z.coerce.number(),
	})

	const defaultObject = defaultObjectBySchema(schema, { age: '22' })

	expect(defaultObject).toStrictEqual({ age: 22 })
})

it('Coerce to type number without default', async () => {
	const schema = z.object({
		age: z.coerce.number(),
	})

	const defaultObject = defaultObjectBySchema(schema, { age: 'John' })

	expect(defaultObject).toStrictEqual({ age: undefined })
})

it('Coerce to type number with default', async () => {
	const schema = z.object({
		age: z.coerce.number().default(0),
	})

	const defaultObject = defaultObjectBySchema(schema, { age: 'John' })

	expect(defaultObject).toStrictEqual({ age: 0 })
})

it('Strip', async () => {
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

it('Passthrough', async () => {
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
