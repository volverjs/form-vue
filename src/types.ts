import type { Component, DeepReadonly, Ref, RendererElement, RendererNode, VNode, WatchStopHandle } from 'vue'
import type * as z3 from 'zod/v3'
import type * as z4 from 'zod/v4/core'
import type { RefinementCtx as z4RefinementCtx } from 'zod/v4'
import type { IgnoredUpdater } from '@vueuse/core'
import type { FormFieldType, FormStatus } from './enums'

type Depth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
type DecrementDepth<D extends Depth[number]> = Depth[D]

export type EffectType<T extends z3.ZodTypeAny, D extends Depth[number] = 10>
    = D extends 0
        ? T
        : T | z3.ZodOptional<T> | z3.ZodNullable<T> | z3.ZodDefault<T> | z3.ZodEffects<EffectType<T, DecrementDepth<D>>>

export type $EffectType<T extends z4.$ZodType, D extends Depth[number] = 10>
    = D extends 0
        ? T
        : T
            | z4.$ZodOptional<$EffectType<T, DecrementDepth<D>>>
            | z4.$ZodNullable<$EffectType<T, DecrementDepth<D>>>
            | z4.$ZodDefault<$EffectType<T, DecrementDepth<D>>>
            | z4.$ZodPipe<$EffectType<T, DecrementDepth<D>>, z4.$ZodType>

// FormSchema garantisce sempre la presenza di safeParse
export type FormSchema = z3.ZodTypeAny | z4.$ZodType

export type InferSchema<T extends FormSchema> = T extends EffectType<z3.AnyZodObject>
    ? z3.z.infer<T>
    : z4.infer<T>

export type InferFormattedError<T extends FormSchema> = T extends EffectType<z3.AnyZodObject>
    ? z3.z.inferFormattedError<T>
    : z4.$ZodFormattedError<T>

export type RefinementCtx<T extends FormSchema> = z3.RefinementCtx | z4RefinementCtx<T>

export type VvZodError<T extends FormSchema> = T extends EffectType<z3.AnyZodObject>
    ? z3.ZodError<T>
    : z4.$ZodError<T>

export type ZodIssue = z3.ZodIssue | z4.$ZodIssue

export type FormFieldComponentOptions = {
    lazyLoad?: boolean
    sideEffects?: (type: `${FormFieldType}`) => Promise<void> | void
}

export type FormComponentOptions<Schema, Type> = {
    updateThrottle?: number
    continuousValidation?: boolean
    readonly?: boolean
    template?: Schema extends FormSchema ? FormTemplate<Schema, Type> : never
    class?: Schema extends FormSchema ? new (data?: Partial<InferSchema<Schema>>) => Type : never
    onUpdate?: Schema extends FormSchema
        ? (data?: undefined extends Type ? Partial<InferSchema<Schema>> : Type) => void
        : never
    onSubmit?: Schema extends FormSchema
        ? (data?: undefined extends Type ? Partial<InferSchema<Schema>> : Type) => void
        : never
    onReset?: Schema extends FormSchema ? (data?: undefined extends Type ? Partial<InferSchema<Schema>> : Type) => void : never
    onInvalid?: Schema extends FormSchema
        ? (error?: InferFormattedError<Schema>) => void
        : never
    onValid?: Schema extends FormSchema
        ? (data?: undefined extends Type ? Partial<InferSchema<Schema>> : Type) => void
        : never
}

export type FormComposableOptions<Schema, Type> = FormFieldComponentOptions
    & FormComponentOptions<Schema, Type> & {
        scope?: string
    }

type FormPluginOptionsSchema<T = Partial<InferSchema<FormSchema>>> = {
    schema?: FormSchema
    factory?: (data?: Partial<InferSchema<FormSchema>>) => T
}

export type FormPluginOptions = FormPluginOptionsSchema
    & FormComposableOptions<FormPluginOptionsSchema['schema'], FormPluginOptionsSchema['factory']>

export type InjectedFormData<Schema extends FormSchema, Type> = {
    formData: Ref<(undefined extends Type ? Partial<InferSchema<Schema>> : Type) | undefined>
    errors: Readonly<
        Ref<DeepReadonly<InferFormattedError<Schema>> | undefined>
    >
    submit: () => Promise<boolean>
    validate: (formData?: undefined extends Type
        ? Partial<InferSchema<Schema>>
        : Type, options?: {
            fields?: Set<Path<InferSchema<Schema>>>
            superRefine?: (arg: InferSchema<Schema>, ctx: RefinementCtx<Schema>) => void | Promise<void>
        }) => Promise<boolean>
    clear: () => void
    reset: () => void
    ignoreUpdates: IgnoredUpdater
    stopUpdatesWatch: WatchStopHandle
    status: Readonly<Ref<FormStatus | undefined>>
    invalid: Readonly<Ref<boolean>>
    readonly: Ref<boolean>
    wrappers: Map<string, InjectedFormWrapperData<Schema>>
}

export type InjectedFormWrapperData<Schema extends FormSchema> = {
    name: Readonly<Ref<string>>
    errors: Ref<Map<string, InferFormattedError<Schema>>>
    invalid: Readonly<Ref<boolean>>
    readonly: Readonly<Ref<boolean>>
    fields: Ref<Map<string, string>>
}

export type InjectedFormFieldData<Schema extends FormSchema> = {
    name: Readonly<Ref<Path<InferSchema<Schema>>>>
    errors: Readonly<Ref<DeepReadonly<InferFormattedError<Schema>>>>
}

export type InjectedFormFieldsGroupData<Schema extends FormSchema> = {
    names: DeepReadonly<Ref<Path<InferSchema<Schema>>[]>>
    errors: Readonly<Ref<DeepReadonly<Record<string, InferFormattedError<Schema>> | undefined>>>
}

export type Primitive
    = | null
        | undefined
        | string
        | number
        | boolean
        | symbol
        | bigint

type IsTuple<T extends readonly any[]> = number extends T['length']
    ? false
    : true

type TupleKeys<T extends readonly any[]> = Exclude<keyof T, keyof any[]>

export type PathConcat<
    TKey extends string | number,
    TValue,
> = TValue extends Primitive ? `${TKey}` : `${TKey}` | `${TKey}.${Path<TValue>}`

export type Path<T> = T extends readonly (infer V)[]
    ? IsTuple<T> extends true
        ? {
                [K in TupleKeys<T>]-?: PathConcat<K & string, T[K]>
            }[TupleKeys<T>]
        : PathConcat<number, V>
    : {
            [K in keyof T]-?: PathConcat<K & string, T[K]>
        }[keyof T]

export type PathValue<T, TPath extends Path<T> | Path<T>[]> = T extends any
    ? TPath extends `${infer K}.${infer R}`
        ? K extends keyof T
            ? R extends Path<T[K]>
                ? undefined extends T[K]
                    ? PathValue<T[K], R> | undefined
                    : PathValue<T[K], R>
                : never
            : K extends `${number}`
                ? T extends readonly (infer V)[]
                    ? PathValue<V, R & Path<V>>
                    : never
                : never
        : TPath extends keyof T
            ? T[TPath]
            : TPath extends `${number}`
                ? T extends readonly (infer V)[]
                    ? V
                    : never
                : never
    : never

export type AnyBoolean<Schema extends FormSchema, Type>
    = | boolean
        | Ref<boolean>
        | ((data?: InjectedFormData<Schema, Type>) => boolean | Ref<boolean>)

export type SimpleFormTemplateItem<Schema extends FormSchema, Type> = Record<
    string,
    any
> & {
    vvIs?: string | Component
    vvName?: Path<InferSchema<Schema>>
    vvSlots?: Record<string, any>
    vvChildren?:
        | Array<
            | SimpleFormTemplateItem<Schema, Type>
            | ((
                data?: InjectedFormData<Schema, Type>,
                scope?: Record<string, unknown>,
            ) => SimpleFormTemplateItem<Schema, Type>)
        >
        | ((
            data?: InjectedFormData<Schema, Type>,
            scope?: Record<string, unknown>,
        ) => Array<
            | SimpleFormTemplateItem<Schema, Type>
            | ((
                data?: InjectedFormData<Schema, Type>,
                scope?: Record<string, unknown>,
            ) => SimpleFormTemplateItem<Schema, Type>)
        >)
    vvIf?: AnyBoolean<Schema, Type> | Path<InferSchema<Schema>>
    vvElseIf?: AnyBoolean<Schema, Type> | Path<InferSchema<Schema>>
    vvType?: `${FormFieldType}`
    vvShowValid?: boolean
    vvContent?: string
    vvDefaultValue?: any
}

export type FormTemplateItem<Schema extends FormSchema, Type = undefined>
    = | SimpleFormTemplateItem<Schema, Type>
        | ((
            data?: InjectedFormData<Schema, Type>,
            scope?: Record<string, unknown>,
        ) => SimpleFormTemplateItem<Schema, Type>)

export type FormTemplate<Schema extends FormSchema, Type = undefined>
    = | FormTemplateItem<Schema, Type>[]
        | ((
            data?: InjectedFormData<Schema, Type>,
            scope?: Record<string, unknown>,
        ) => FormTemplateItem<Schema, Type>[])

export type RenderFunctionOutput = VNode<RendererNode, RendererElement, { [key: string]: any }>
