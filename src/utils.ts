import merge from 'deepmerge'
import {
	type z,
	type AnyZodObject,
	ZodDefault,
	ZodObject,
	ZodEffects,
} from 'zod'

export const defaultObjectBySchema = <
	Schema extends AnyZodObject | ZodEffects<AnyZodObject>,
>(
	schema: Schema,
	original: Partial<z.infer<Schema>> = {},
): Partial<z.infer<Schema>> => {
	const shape =
		schema instanceof ZodEffects ? schema.innerType().shape : schema.shape
	return merge(
		Object.fromEntries(
			Object.entries(shape).map(([key, value]) => {
				if (value instanceof ZodDefault) {
					return [key, value._def.defaultValue()]
				}
				if (value instanceof ZodObject) {
					return [key, defaultObjectBySchema(value)]
				}
				return [key, undefined]
			}),
		),
		original,
	) as Partial<z.infer<Schema>>
}
