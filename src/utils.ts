import {
    ZodDefault,
    ZodObject,
    ZodEffects,
    ZodSchema,
    ZodNullable,
    ZodOptional,
    ZodRecord,
    ZodArray,
    ZodError,
} from 'zod/v3'
import {
    $ZodError,
    safeParse as z4SafeParse,
    safeParseAsync as z4SafeParseAsync,
    formatError as z4FormatError,
} from 'zod/v4/core'
import { toJSONSchema as z4toJSONSchema } from 'zod/v4'
import type * as z3 from 'zod/v3'
import type * as z4 from 'zod/v4/core'
import type { FormSchema, InferSchema, VvZodError, ZodIssue } from './types'

const getZod3SchemaInnerType = <Type extends z3.ZodTypeAny>(
    schema:
        | Type
        | z3.ZodEffects<Type>
        | z3.ZodEffects<ZodEffects<Type>>
        | z3.ZodOptional<Type>,
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

const isZod3SchemaOptional = <Type extends z3.ZodTypeAny>(
    schema:
        | Type
        | z3.ZodEffects<Type>
        | z3.ZodEffects<ZodEffects<Type>>
        | z3.ZodOptional<Type>
        | z3.ZodNullable<Type>,
) => {
    let toReturn = schema
    while (toReturn instanceof ZodEffects) {
        toReturn = toReturn.innerType()
    }
    if (toReturn instanceof ZodOptional) {
        return true
    }
    if (toReturn instanceof ZodNullable) {
        return true
    }
    return false
}

// Helper function to check if a value matches a schema type
function isValueCompatibleWithSchema(value: unknown, subSchema: z4.JSONSchema.JSONSchema): boolean {
    const valueType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value

    if (subSchema.type) {
        return subSchema.type === valueType
            || (subSchema.type === 'integer' && valueType === 'number' && Number.isInteger(value as number))
    }

    // If no type specified, assume compatibility
    return true
}

export function defaultObjectByJSONSchema(schema: z4.JSONSchema.JSONSchema, original?: unknown): unknown {
    // Handle anyOf - find the best matching schema without unnecessary recursion
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
        if (original !== undefined) {
            // First pass: find exact type match
            for (const subSchema of schema.anyOf) {
                if (isValueCompatibleWithSchema(original, subSchema as z4.JSONSchema.JSONSchema)) {
                    return defaultObjectByJSONSchema(subSchema as z4.JSONSchema.JSONSchema, original)
                }
            }
            // Second pass: try first schema that doesn't explicitly conflict
            for (const subSchema of schema.anyOf) {
                const subSchemaTyped = subSchema as z4.JSONSchema.JSONSchema
                if (!subSchemaTyped.type || subSchemaTyped.type === 'object') {
                    return defaultObjectByJSONSchema(subSchemaTyped, original)
                }
            }
        }
        // Fallback to first schema
        return defaultObjectByJSONSchema(schema.anyOf[0] as z4.JSONSchema.JSONSchema, original)
    }

    // Early return for non-object types
    if (schema.type !== 'object' || !schema.properties) {
        switch (schema.type) {
            case 'string':
                return typeof original === 'string' ? original : schema.default
            case 'number':
            case 'integer':
                return typeof original === 'number' ? original : schema.default
            case 'boolean':
                return typeof original === 'boolean' ? original : schema.default
            case 'null':
                return original === null ? original : schema.default
            case 'array':
                if (Array.isArray(original) && schema.items) {
                    return original.map(item => defaultObjectByJSONSchema(schema.items as z4.JSONSchema.JSONSchema, item))
                }
                return schema.default
            default:
                return schema.default
        }
    }

    // Object handling with optimizations
    const properties = schema.properties as Record<string, z4.JSONSchema.JSONSchema>
    const isOriginalObject = original && typeof original === 'object' && !Array.isArray(original)
    const originalObj = isOriginalObject ? original as Record<string, unknown> : undefined

    // Initialize result object more efficiently
    const toReturn: Record<string, unknown> = {}

    // Process schema properties first
    for (const key in properties) {
        const originalValue = originalObj?.[key]
        toReturn[key] = defaultObjectByJSONSchema(properties[key], originalValue)
    }

    // Handle additional properties after schema properties
    if (originalObj && schema.additionalProperties !== false) {
        const schemaKeys = new Set(Object.keys(properties))

        for (const [key, value] of Object.entries(originalObj)) {
            if (!schemaKeys.has(key)) {
                // Allow any additional properties as-is
                toReturn[key] = value
            }
        }
    }

    return toReturn
}

export const isZod4Schema = (schema: z3.ZodTypeAny | z4.$ZodType): schema is z4.$ZodType => {
    if ('_zod' in schema) {
        return true
    }
    return false
}

export function defaultObjectBySchema<Schema extends FormSchema>(schema: Schema, original: Partial<InferSchema<Schema>> & Record<string, unknown> = {}): Partial<InferSchema<Schema>> {
    // zod v4
    if (isZod4Schema(schema)) {
        const jsonSchema = z4toJSONSchema(schema)
        if (jsonSchema.type !== 'object' || !jsonSchema.properties) {
            return original
        }
        const parse = z4SafeParse(schema, original)
        return defaultObjectByJSONSchema(jsonSchema, parse.success ? parse.data : original) as Partial<InferSchema<Schema>>
    }

    // zod v3
    const innerType = getZod3SchemaInnerType(schema)

    if (!(innerType instanceof ZodObject)) {
        return original
    }
    const unknownKeys
        = innerType instanceof ZodObject
            ? innerType._def.unknownKeys === 'passthrough'
            : false
    return {
        ...(unknownKeys ? original : {}),
        ...Object.fromEntries(
            ('shape' in innerType ? Object.entries(innerType.shape) as [string, z3.ZodTypeAny][] : []).map(
                ([key, subSchema]) => {
                    const originalValue = original[key]
                    const isOptional = isZod3SchemaOptional(subSchema)
                    let innerType = getZod3SchemaInnerType(subSchema)
                    let defaultValue: Partial<InferSchema<Schema>> | undefined
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
                        const arrayType = getZod3SchemaInnerType(innerType._def.type)
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
                        const valueType = getZod3SchemaInnerType(innerType._def.valueType)
                        if (valueType instanceof ZodObject) {
                            return [key, Object.keys(originalValue).reduce((acc: Record<string, unknown>, recordKey: string) => {
                                acc[recordKey] = defaultObjectBySchema(valueType, (originalValue as Record<string, unknown>)[recordKey] as Partial<any> & Record<string, unknown>)
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
                                    ? (originalValue as Partial<InferSchema<Schema>> & Record<string, unknown>)
                                    : defaultValue,
                            ),
                        ]
                    }
                    return [key, defaultValue]
                },
            ),
        ),
    } as Partial<InferSchema<Schema>>
}

export const safeParseAsync = <T extends FormSchema>(schema: T, data: any) => {
    if (isZod4Schema(schema)) {
        return z4SafeParseAsync(schema, data)
    }
    return schema.safeParseAsync(data)
}

export const formatError = <T extends FormSchema>(schema: T, error: VvZodError<T>) => {
    if (isZod4Schema(schema)) {
        return z4FormatError(error as z4.$ZodError<T>)
    }
    return (error as z3.ZodError<T>).format()
}

export const formatIssues = (schema: FormSchema, issues: ZodIssue[]) => {
    if (isZod4Schema(schema)) {
        return z4FormatError(new $ZodError(issues as z4.$ZodIssue[]))
    }
    return new ZodError(issues as z3.ZodIssue[]).format()
}
