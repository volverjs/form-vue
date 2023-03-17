import {
	type z,
	type AnyZodObject,
	ZodDefault,
	ZodObject,
	ZodEffects,
	ZodSchema,
	ZodNullable,
} from 'zod'

export const defaultObjectBySchema = <
	Schema extends AnyZodObject | ZodEffects<AnyZodObject>,
>(
	schema: Schema,
	original: Partial<z.infer<Schema>> = {},
): Partial<z.infer<Schema>> => {
	const shape =
		schema instanceof ZodEffects ? schema.innerType().shape : schema.shape

	const unknownKeys =
		schema instanceof ZodObject
			? schema._def.unknownKeys === 'passthrough'
			: false
	return {
		...(unknownKeys ? original : {}),
		...Object.fromEntries(
			Object.entries(shape).map(([key, subSchema]) => {
				const originalValue = original[key]
				let defaultValue = undefined
				if (subSchema instanceof ZodDefault) {
					defaultValue = subSchema._def.defaultValue()
				}
				if (
					originalValue === null &&
					subSchema instanceof ZodNullable
				) {
					return [key, originalValue]
				}
				if (subSchema instanceof ZodSchema) {
					const parse = subSchema.safeParse(original[key])
					if (parse.success) {
						return [key, parse.data ?? defaultValue]
					}
				}
				if (subSchema instanceof ZodObject) {
					return [
						key,
						defaultObjectBySchema(
							subSchema,
							originalValue && typeof originalValue === 'object'
								? originalValue
								: {},
						),
					]
				}
				return [key, defaultValue]
			}),
		),
	} as Partial<z.infer<Schema>>
}
