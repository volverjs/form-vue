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
    ZodRecord,
    ZodArray,
} from 'zod'
import type { FormSchema } from './types'

export function defaultObjectBySchema<Schema extends FormSchema>(schema: Schema, original: Partial<z.infer<Schema>> & Record<string, unknown> = {}): Partial<z.infer<Schema>> {
    const getSchemaInnerType = <Type extends ZodTypeAny>(
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
    const isSchemaOptional = <Type extends ZodTypeAny>(
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
            return true
        }
        return false
    }
    const innerType = getSchemaInnerType<AnyZodObject>(schema)
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
                    const isOptional = isSchemaOptional(subSchema)
                    let innerType = getSchemaInnerType(subSchema)
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
                    if ((originalValue === undefined || originalValue === null) && isOptional) {
                        return [key, defaultValue]
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
                        const arrayType = getSchemaInnerType(innerType._def.type)
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
                                ),
                            ]
                        }
                    }
                    if (innerType instanceof ZodRecord && originalValue) {
                        const valueType = getSchemaInnerType(innerType._def.valueType)
                        if (valueType instanceof ZodObject) {
                            return [key, Object.keys(originalValue).reduce((acc: Record<string, unknown>, recordKey: string) => {
                                acc[recordKey] = defaultObjectBySchema(valueType, originalValue[recordKey])
                                return acc
                            }, {})]
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
