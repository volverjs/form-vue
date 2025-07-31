import {
    ZodError,
} from 'zod/v3'
import {
    $ZodError,
    safeParse as z4SafeParse,
    safeParseAsync as z4SafeParseAsync,
    formatError as z4FormatError,
} from 'zod/v4/core'
import type * as z3 from 'zod/v3'
import type * as z4 from 'zod/v4/core'
import type { FormSchema, InferSchema, VvZodError, ZodIssue } from './types'

// Helper function to determine the type of a value
function _getValueType(value: unknown) {
    if (Array.isArray(value)) {
        return 'array'
    }
    if (value === null) {
        return 'null'
    }
    return typeof value
}

// Helper function to check if a value matches a schema type
function _isValueCompatibleWithSchema(value: unknown, subSchema: z4.JSONSchema.JSONSchema): boolean {
    const valueType = _getValueType(value)

    if (subSchema.type) {
        return subSchema.type === valueType
            || (subSchema.type === 'integer' && valueType === 'number' && Number.isInteger(value as number))
    }

    // If no type specified, assume compatibility
    return true
}

export const isZod3Object = (value: z3.ZodTypeAny): value is z3.ZodObject<any> => {
    return value._def.typeName === 'ZodObject'
}

export const isZod4Object = (value: z4.$ZodType): value is z4.$ZodObject<any> => {
    return value._zod.def.type === 'object'
}

export const isZod3Default = (value: z3.ZodTypeAny): value is z3.ZodDefault<any> => {
    return value._def.typeName === 'ZodDefault'
}

export const isZod4Default = (value: z4.$ZodType): value is z4.$ZodDefault<any> => {
    return value._zod.def.type === 'default'
}

export const isZod3Nullable = (value: z3.ZodTypeAny): value is z3.ZodNullable<any> => {
    return value._def.typeName === 'ZodNullable'
}

export const isZod4Nullable = (value: z4.$ZodType): value is z4.$ZodNullable<any> => {
    return value._zod.def.type === 'nullable'
}

export const isZod3Record = (value: z3.ZodTypeAny): value is z3.ZodRecord<any, any> => {
    return value._def.typeName === 'ZodRecord'
}

export const isZod4Record = (value: z4.$ZodType): value is z4.$ZodRecord<any, any> => {
    return value._zod.def.type === 'record'
}

export const isZod3Array = (value: z3.ZodTypeAny): value is z3.ZodArray<any> => {
    return value._def.typeName === 'ZodArray'
}

export const isZod4Array = (value: z4.$ZodType): value is z4.$ZodArray<any> => {
    return value._zod.def.type === 'array'
}

export const isZod3Effects = (value: z3.ZodTypeAny): value is z3.ZodEffects<any> => {
    return value._def.typeName === 'ZodEffects'
}

export const isZod3Optional = (value: z3.ZodTypeAny): value is z3.ZodOptional<any> => {
    return value._def.typeName === 'ZodOptional'
}

export const isZod4Optional = (value: z4.$ZodType): value is z4.$ZodOptional<any> => {
    return value._zod.def.type === 'optional'
}

// replace of effercts
export const isZod4Pipe = (value: z4.$ZodType): value is z4.$ZodPipe<any> => {
    return value._zod.def.type === 'pipe'
}

export const isZod4Transform = (value: z4.$ZodType): value is z4.$ZodTransform<any> => {
    return value._zod.def.type === 'transform'
}

// Helper function to get the inner type of a Zod schema
export const getZod3SchemaInnerType = <Type extends z3.ZodTypeAny>(
    schema:
        | Type
        | z3.ZodEffects<Type>
        | z3.ZodEffects<z3.ZodEffects<Type>>
        | z3.ZodOptional<Type>,
) => {
    let toReturn = schema
    while (isZod3Effects(toReturn)) {
        toReturn = toReturn.innerType()
    }
    if (isZod3Optional(toReturn)) {
        toReturn = toReturn._def.innerType
    }
    return toReturn
}

export const getZod4SchemaInnerType = <Type extends z4.$ZodType>(
    schema:
        | Type
        | z4.$ZodPipe<Type>
        | z4.$ZodPipe<any, Type>
        | z4.$ZodOptional<Type>,
) => {
    let toReturn = schema
    while (isZod4Pipe(toReturn)) {
        if (isZod4Transform(toReturn._zod.def.out)) {
            toReturn = toReturn._zod.def.in
        }
        else {
            toReturn = toReturn._zod.def.out as Type
        }
    }
    if (isZod4Optional(toReturn)) {
        toReturn = toReturn._zod.def.innerType
    }
    return toReturn
}

// Helper function to check if a Zod schema is optional
export const isZod3SchemaOptional = <Type extends z3.ZodTypeAny>(
    schema:
        | Type
        | z3.ZodEffects<Type>
        | z3.ZodEffects<z3.ZodEffects<Type>>
        | z3.ZodOptional<Type>,
) => {
    let toReturn = schema
    while (isZod3Effects(toReturn)) {
        toReturn = toReturn.innerType()
    }
    if (isZod3Optional(toReturn)) {
        return true
    }
    return false
}

export const isZod4SchemaOptional = <Type extends z4.$ZodType>(
    schema:
        | Type
        | z4.$ZodPipe<Type>
        | z4.$ZodPipe<any, Type>
        | z4.$ZodOptional<Type>,
) => {
    let toReturn = schema
    while (isZod4Pipe(toReturn)) {
        if (isZod4Transform(toReturn._zod.def.out)) {
            toReturn = toReturn._zod.def.in
        }
        else {
            toReturn = toReturn._zod.def.out as Type
        }
    }
    if (isZod4Optional(toReturn)) {
        return true
    }
    return false
}

export function defaultObjectByJSONSchema(schema: z4.JSONSchema.JSONSchema, original?: unknown): unknown {
    // Handle anyOf - find the best matching schema without unnecessary recursion
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
        if (original !== undefined) {
            // First pass: find exact type match
            for (const subSchema of schema.anyOf) {
                if (_isValueCompatibleWithSchema(original, subSchema as z4.JSONSchema.JSONSchema)) {
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
        const innerType = getZod4SchemaInnerType(schema)
        if (!isZod4Object(innerType)) {
            return original
        }
        const unknownKeys = !(!innerType._zod.def.catchall || innerType._zod.def.catchall?._zod.def.type === 'never')

        return {
            ...(unknownKeys ? original : {}),
            ...Object.fromEntries(
                ('shape' in innerType._zod.def ? Object.entries(innerType._zod.def.shape) as [string, z4.$ZodType][] : []).map(
                    ([key, subSchema]) => {
                        const originalValue = original[key]
                        const isOptional = isZod4SchemaOptional(subSchema)
                        let innerType = getZod4SchemaInnerType(subSchema)
                        let defaultValue: Partial<InferSchema<Schema>> | undefined
                        if (isZod4Default(innerType)) {
                            defaultValue = innerType._zod.def.defaultValue
                            innerType = innerType._zod.def.innerType
                        }
                        if (
                            originalValue === null
                            && isZod4Nullable(innerType)
                        ) {
                            return [key, originalValue]
                        }
                        if ((originalValue === undefined || originalValue === null) && isOptional) {
                            return [key, defaultValue]
                        }
                        if (innerType) {
                            const parse = z4SafeParse(subSchema, originalValue)
                            if (parse.success) {
                                return [key, parse.data ?? defaultValue]
                            }
                        }
                        if (
                            isZod4Array(innerType)
                            && Array.isArray(originalValue)
                            && originalValue.length
                        ) {
                            const arrayType = getZod4SchemaInnerType(innerType._zod.def.element)
                            if (isZod4Object(arrayType)) {
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
                        if (isZod4Record(innerType) && originalValue) {
                            const valueType = getZod4SchemaInnerType(innerType._zod.def.valueType)
                            if (isZod4Object(valueType)) {
                                return [key, Object.keys(originalValue).reduce((acc: Record<string, unknown>, recordKey: string) => {
                                    acc[recordKey] = defaultObjectBySchema(valueType, originalValue[recordKey])
                                    return acc
                                }, {})]
                            }
                        }
                        if (isZod4Object(innerType)) {
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
        } as Partial<InferSchema<Schema>>
    }

    // zod v3
    const innerType = getZod3SchemaInnerType(schema)

    if (!isZod3Object(innerType)) {
        return original
    }
    const unknownKeys = innerType._def.unknownKeys === 'passthrough'
    return {
        ...(unknownKeys ? original : {}),
        ...Object.fromEntries(
            ('shape' in innerType ? Object.entries(innerType.shape) as [string, z3.ZodTypeAny][] : []).map(
                ([key, subSchema]) => {
                    const originalValue = original[key]
                    const isOptional = isZod3SchemaOptional(subSchema)
                    let innerType = getZod3SchemaInnerType(subSchema)
                    let defaultValue: Partial<InferSchema<Schema>> | undefined
                    if (isZod3Default(innerType)) {
                        defaultValue = innerType._def.defaultValue()
                        innerType = innerType._def.innerType
                    }
                    if (
                        originalValue === null
                        && isZod3Nullable(innerType)
                    ) {
                        return [key, originalValue]
                    }
                    if ((originalValue === undefined || originalValue === null) && isOptional) {
                        return [key, defaultValue]
                    }
                    if (innerType) {
                        const parse = subSchema.safeParse(originalValue)
                        if (parse.success) {
                            return [key, parse.data ?? defaultValue]
                        }
                    }
                    if (
                        isZod3Array(innerType)
                        && Array.isArray(originalValue)
                        && originalValue.length
                    ) {
                        const arrayType = getZod3SchemaInnerType(innerType._def.type)
                        if (isZod3Object(arrayType)) {
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
                    if (isZod3Record(innerType) && originalValue) {
                        const valueType = getZod3SchemaInnerType(innerType._def.valueType)
                        if (isZod3Object(valueType)) {
                            return [key, Object.keys(originalValue).reduce((acc: Record<string, unknown>, recordKey: string) => {
                                acc[recordKey] = defaultObjectBySchema(valueType, originalValue[recordKey])
                                return acc
                            }, {})]
                        }
                    }
                    if (isZod3Object(innerType)) {
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
