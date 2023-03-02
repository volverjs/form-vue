import merge from 'deepmerge'
import { type z, type AnyZodObject, ZodDefault, ZodObject } from 'zod'

export const defaultObjectBySchema = <Schema extends AnyZodObject>(
	schema: Schema,
	original: Partial<z.infer<Schema>> = {},
): Record<string | number, unknown> => {
	return merge(
		Object.fromEntries(
			Object.entries(schema.shape).map(([key, value]) => {
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
