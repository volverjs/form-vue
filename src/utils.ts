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
    ZodArray,
} from 'zod'
import type { FormSchema } from './types'

export function defaultObjectBySchema<Schema extends FormSchema>(schema: Schema,	original: Partial<z.infer<Schema>> & Record<string, unknown> = {}): Partial<z.infer<Schema>> {
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
        if (toReturn instanceof ZodOptional) {
            toReturn = toReturn._def.innerType
        }
        return toReturn
    }
    const innerType = getInnerType<AnyZodObject>(schema)
    const unknownKeys
		= innerType instanceof ZodObject
		    ? innerType._def.unknownKeys === 'passthrough'
		    : false
    return {
        ...(unknownKeys ? original : {}),
        ...Object.fromEntries(
            (Object.entries(innerType.shape) as [string, ZodTypeAny][]).map(
                ([key, subSchema]) => {
                    const originalValue = original[key]
                    let innerType = getInnerType(subSchema)
                    let defaultValue: Partial<z.infer<Schema>> | undefined
                    if (innerType instanceof ZodDefault) {
                        defaultValue = innerType._def.defaultValue()
                        innerType = innerType._def.innerType
                    }
                    if (
                        originalValue === null
                        && innerType instanceof ZodNullable
                    ) {
                        return [key, originalValue]
                    }
                    if (innerType instanceof ZodSchema) {
                        const parse = subSchema.safeParse(originalValue)
                        if (parse.success) {
                            return [key, parse.data ?? defaultValue]
                        }
                    }
                    if (
                        innerType instanceof ZodArray
                        && Array.isArray(originalValue)
                        && originalValue.length
                    ) {
                        const arrayType = getInnerType(innerType._def.type)
                        if (arrayType instanceof ZodObject) {
                            return [
                                key,
                                originalValue.map((element: unknown) =>
                                    defaultObjectBySchema(
                                        arrayType,
                                        (element && typeof element === 'object'
                                            ? element
                                            : undefined) as Partial<
											typeof arrayType
										>,
                                    ),
                                ) ?? defaultValue,
                            ]
                        }
                    }
                    if (innerType instanceof ZodObject) {
                        return [
                            key,
                            defaultObjectBySchema(
                                innerType,
                                originalValue
                                && typeof originalValue === 'object'
                                    ? originalValue
                                    : defaultValue,
                            ),
                        ]
                    }
                    return [key, defaultValue]
                },
            ),
        ),
    } as Partial<z.infer<Schema>>
}
