import {
	type z,
	type AnyZodObject,
	type ZodTypeAny,
	ZodDefault,
	ZodObject,
	ZodEffects,
	ZodSchema,
	ZodNullable,
	ZodOptional,
} from 'zod'
import type { FormSchema } from './types'

export const defaultObjectBySchema = <Schema extends FormSchema>(
	schema: Schema,
	original: Partial<z.infer<Schema>> = {},
): Partial<z.infer<Schema>> => {
	const getInnerType = <Type extends ZodTypeAny>(
		schema:
			| Type
			| ZodEffects<Type>
			| ZodEffects<ZodEffects<Type>>
			| ZodOptional<Type>,
	) => {
		let toReturn = schema
		while (toReturn instanceof ZodEffects) {
			toReturn = toReturn.innerType()
		}
		while (toReturn instanceof ZodOptional) {
			toReturn = toReturn._def.innerType
		}
		return toReturn
	}
	const innerType = getInnerType<AnyZodObject>(schema)
	const unknownKeys =
		innerType instanceof ZodObject
			? innerType._def.unknownKeys === 'passthrough'
			: false
	return {
		...(unknownKeys ? original : {}),
		...Object.fromEntries(
			(Object.entries(innerType.shape) as [string, ZodTypeAny][]).map(
				([key, subSchema]) => {
					const originalValue = original[key]
					const innerType = getInnerType(subSchema)
					let defaultValue = undefined
					if (innerType instanceof ZodDefault) {
						defaultValue = innerType._def.defaultValue()
					}
					if (
						originalValue === null &&
						innerType instanceof ZodNullable
					) {
						return [key, originalValue]
					}
					if (innerType instanceof ZodSchema) {
						const parse = subSchema.safeParse(originalValue)
						if (parse.success) {
							return [key, parse.data ?? defaultValue]
						}
					}
					if (innerType instanceof ZodObject) {
						return [
							key,
							defaultObjectBySchema(
								innerType,
								originalValue &&
									typeof originalValue === 'object'
									? originalValue
									: {},
							),
						]
					}
					return [key, defaultValue]
				},
			),
		),
	} as Partial<z.infer<Schema>>
}
