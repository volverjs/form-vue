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
        // Handle type as array (e.g. ["string", "null"])
        if (Array.isArray(subSchema.type)) {
            return subSchema.type.some(t =>
                t === valueType
                || (t === 'integer' && valueType === 'number' && Number.isInteger(value as number)),
            )
        }
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

// zod 4 replacements for ZodEffects
export const isZod4Pipe = (value: z4.$ZodType): value is z4.$ZodPipe<any> => {
    return value._zod.def.type === 'pipe'
}

export const isZod4Transform = (value: z4.$ZodType): value is z4.$ZodTransform<any> => {
    return value._zod.def.type === 'transform'
}

function _loopOnZod3Effects<Type extends z3.ZodTypeAny>(
    schema: Type | z3.ZodEffects<Type> | z3.ZodEffects<z3.ZodEffects<Type>>,
) {
    let toReturn = schema
    while (isZod3Effects(toReturn)) {
        toReturn = toReturn.innerType()
    }
    return toReturn
}

function _loopOnZod4Pipe<Type extends z4.$ZodType>(
    schema:
        | Type
        | z4.$ZodPipe<Type>
        | z4.$ZodPipe<any, Type>,
) {
    let toReturn = schema
    while (isZod4Pipe(toReturn)) {
        if (isZod4Transform(toReturn._zod.def.out)) {
            toReturn = toReturn._zod.def.in
        }
        else {
            toReturn = toReturn._zod.def.out as Type
        }
    }
    return toReturn
}

// Helper function to get the inner type of a Zod schema
export const getZod3SchemaInnerType = <Type extends z3.ZodTypeAny>(
    schema:
        | Type
        | z3.ZodEffects<Type>
        | z3.ZodEffects<z3.ZodEffects<Type>>
        | z3.ZodOptional<Type>,
) => {
    let toReturn = _loopOnZod3Effects(schema)
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
    let toReturn = _loopOnZod4Pipe(schema)
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
    const toReturn = _loopOnZod3Effects(schema)
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
    const toReturn = _loopOnZod4Pipe(schema)
    if (isZod4Optional(toReturn)) {
        return true
    }
    return false
}

// Helper to resolve anyOf/oneOf variants
function _resolveVariantSchema(
    variants: readonly z4.JSONSchema.BaseSchema[],
    original: unknown | undefined,
): unknown {
    if (variants.length === 0) {
        return original ?? undefined
    }
    if (original !== undefined) {
        // First pass: find exact type match
        for (const subSchema of variants) {
            if (_isValueCompatibleWithSchema(original, subSchema as z4.JSONSchema.JSONSchema)) {
                return defaultObjectByJSONSchema(subSchema as z4.JSONSchema.JSONSchema, original)
            }
        }
        // Second pass: try first schema that doesn't explicitly conflict
        for (const subSchema of variants) {
            const subSchemaTyped = subSchema as z4.JSONSchema.JSONSchema
            if (!subSchemaTyped.type || subSchemaTyped.type === 'object') {
                return defaultObjectByJSONSchema(subSchemaTyped, original)
            }
        }
    }
    // Fallback to first schema
    return defaultObjectByJSONSchema(variants[0] as z4.JSONSchema.JSONSchema, original)
}

export function defaultObjectByJSONSchema(schema: z4.JSONSchema.JSONSchema, original?: unknown): unknown {
    // Handle const — fixed value
    if ('const' in schema) {
        return schema.const
    }

    // Handle anyOf
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
        return _resolveVariantSchema(schema.anyOf, original)
    }

    // Handle oneOf (semantically similar to anyOf for defaults)
    if (schema.oneOf && Array.isArray(schema.oneOf)) {
        return _resolveVariantSchema(schema.oneOf, original)
    }

    // Handle allOf — merge all sub-schemas into one and process
    if (schema.allOf && Array.isArray(schema.allOf)) {
        const merged: z4.JSONSchema.JSONSchema = { ...schema, allOf: undefined }
        for (const subSchema of schema.allOf) {
            const sub = subSchema as z4.JSONSchema.JSONSchema
            if (sub.properties) {
                merged.properties = { ...merged.properties as Record<string, z4.JSONSchema.JSONSchema>, ...sub.properties as Record<string, z4.JSONSchema.JSONSchema> }
            }
            if (sub.type && !merged.type) {
                merged.type = sub.type
            }
        }
        return defaultObjectByJSONSchema(merged, original)
    }

    // Handle type as array (e.g. ["string", "null"]) — check null first
    if (Array.isArray(schema.type)) {
        if (original === null && schema.type.includes('null')) {
            return null
        }
        // Find the first non-null type and delegate
        const nonNullType = schema.type.find(t => t !== 'null')
        if (nonNullType) {
            return defaultObjectByJSONSchema({ ...schema, type: nonNullType } as z4.JSONSchema.JSONSchema, original)
        }
        return schema.default ?? null
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
                if (Array.isArray(original)) {
                    if (schema.items) {
                        return original.map(item => defaultObjectByJSONSchema(schema.items as z4.JSONSchema.JSONSchema, item))
                    }
                    return original
                }
                return schema.default
            default:
                return schema.default
        }
    }

    // Object handling
    const properties = schema.properties as Record<string, z4.JSONSchema.JSONSchema>
    const isOriginalObject = original && typeof original === 'object' && !Array.isArray(original)
    const originalObj = isOriginalObject ? original as Record<string, unknown> : undefined

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

/**
 * Adapter that abstracts the version-specific Zod internals (zod v3 vs v4) so
 * that the `defaultObjectBySchema` algorithm can be written once.
 */
interface ZodAdapter {
    getInnerType: (schema: any) => any
    isObject: (schema: any) => boolean
    hasUnknownKeys: (objectSchema: any) => boolean
    getShapeEntries: (objectSchema: any) => [string, any][]
    isOptional: (schema: any) => boolean
    isDefault: (schema: any) => boolean
    getDefaultValue: (schema: any) => unknown
    getDefaultInnerType: (schema: any) => any
    isNullable: (schema: any) => boolean
    safeParse: (schema: any, value: unknown) => { success: boolean, data?: unknown }
    isArray: (schema: any) => boolean
    getArrayElement: (schema: any) => any
    isRecord: (schema: any) => boolean
    getRecordValue: (schema: any) => any
}

const zod3Adapter: ZodAdapter = {
    getInnerType: getZod3SchemaInnerType,
    isObject: isZod3Object,
    hasUnknownKeys: schema => schema._def.unknownKeys === 'passthrough',
    getShapeEntries: schema => ('shape' in schema ? Object.entries(schema.shape) : []),
    isOptional: isZod3SchemaOptional,
    isDefault: isZod3Default,
    getDefaultValue: schema => schema._def.defaultValue(),
    getDefaultInnerType: schema => schema._def.innerType,
    isNullable: isZod3Nullable,
    safeParse: (schema, value) => schema.safeParse(value),
    isArray: isZod3Array,
    getArrayElement: schema => schema._def.type,
    isRecord: isZod3Record,
    getRecordValue: schema => schema._def.valueType,
}

const zod4Adapter: ZodAdapter = {
    getInnerType: getZod4SchemaInnerType,
    isObject: isZod4Object,
    hasUnknownKeys: schema => Boolean(schema._zod.def.catchall && schema._zod.def.catchall._zod.def.type !== 'never'),
    getShapeEntries: schema => ('shape' in schema._zod.def ? Object.entries(schema._zod.def.shape) : []),
    isOptional: isZod4SchemaOptional,
    isDefault: isZod4Default,
    getDefaultValue: schema => schema._zod.def.defaultValue,
    getDefaultInnerType: schema => schema._zod.def.innerType,
    isNullable: isZod4Nullable,
    safeParse: (schema, value) => z4SafeParse(schema, value),
    isArray: isZod4Array,
    getArrayElement: schema => schema._zod.def.element,
    isRecord: isZod4Record,
    getRecordValue: schema => schema._zod.def.valueType,
}

// Resolves the default value for a single shape entry of a Zod object schema.
function _resolveShapeEntry(adapter: ZodAdapter, key: string, subSchema: any, originalValue: unknown): [string, unknown] {
    const isOptional = adapter.isOptional(subSchema)
    let innerType = adapter.getInnerType(subSchema)
    let defaultValue: unknown
    if (adapter.isDefault(innerType)) {
        defaultValue = adapter.getDefaultValue(innerType)
        innerType = adapter.getDefaultInnerType(innerType)
    }
    if (originalValue === null && adapter.isNullable(innerType)) {
        return [key, originalValue]
    }
    if ((originalValue === undefined || originalValue === null) && isOptional) {
        return [key, defaultValue]
    }
    if (innerType && originalValue !== undefined) {
        const parse = adapter.safeParse(subSchema, originalValue)
        if (parse.success) {
            return [key, parse.data ?? defaultValue]
        }
    }
    if (adapter.isArray(innerType) && Array.isArray(originalValue)) {
        const arrayType = adapter.getInnerType(adapter.getArrayElement(innerType))
        if (adapter.isObject(arrayType)) {
            return [key, originalValue.map(element => _defaultObjectFromShape(adapter, arrayType, element))]
        }
        return [key, originalValue]
    }
    if (adapter.isRecord(innerType) && originalValue) {
        const valueType = adapter.getInnerType(adapter.getRecordValue(innerType))
        if (adapter.isObject(valueType)) {
            return [key, Object.keys(originalValue).reduce<Record<string, unknown>>((acc, recordKey) => {
                acc[recordKey] = _defaultObjectFromShape(adapter, valueType, (originalValue as Record<string, unknown>)[recordKey])
                return acc
            }, {})]
        }
        return [key, originalValue]
    }
    if (adapter.isObject(innerType)) {
        return [key, _defaultObjectFromShape(
            adapter,
            innerType,
            originalValue && typeof originalValue === 'object' ? originalValue : defaultValue,
        )]
    }
    return [key, defaultValue]
}

// Builds the default object for an (already unwrapped) Zod object schema.
function _defaultObjectFromShape(adapter: ZodAdapter, objectSchema: any, original: unknown): Record<string, unknown> {
    const safeOriginal = (original && typeof original === 'object' && !Array.isArray(original))
        ? original as Record<string, unknown>
        : {}
    return {
        ...(adapter.hasUnknownKeys(objectSchema) ? safeOriginal : {}),
        ...Object.fromEntries(
            adapter.getShapeEntries(objectSchema).map(([key, subSchema]) =>
                _resolveShapeEntry(adapter, key, subSchema, safeOriginal[key]),
            ),
        ),
    }
}

export function defaultObjectBySchema<Schema extends FormSchema>(schema: Schema, original: Partial<InferSchema<Schema>> & Record<string, unknown> = {}): Partial<InferSchema<Schema>> {
    const adapter = isZod4Schema(schema) ? zod4Adapter : zod3Adapter
    const innerType = adapter.getInnerType(schema)
    if (!adapter.isObject(innerType)) {
        return original
    }
    return _defaultObjectFromShape(adapter, innerType, original) as Partial<InferSchema<Schema>>
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
