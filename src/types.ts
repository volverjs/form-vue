import type { Component, DeepReadonly, Ref, RendererElement, RendererNode, VNode, WatchStopHandle } from 'vue'
import type { z, AnyZodObject, ZodEffects, ZodOptional, ZodTypeAny } from 'zod'
import type { IgnoredUpdater } from '@vueuse/core'
import type { FormFieldType, FormStatus } from './enums'

type Depth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Adjust the depth limit as needed

type DecrementDepth<D extends Depth[number]> = Depth[D]

export type EffectType<T extends ZodTypeAny, D extends Depth[number] = 10> =
    D extends 0
        ? T
        : T | ZodOptional<T> | ZodEffects<EffectType<T, DecrementDepth<D>>>

export type FormSchema = EffectType<AnyZodObject>

export type FormFieldComponentOptions = {
    lazyLoad?: boolean
    sideEffects?: (type: `${FormFieldType}`) => Promise<void> | void
}

export type FormComponentOptions<Schema, Type> = {
    updateThrottle?: number
    continuousValidation?: boolean
    readonly?: boolean
    template?: Schema extends FormSchema ? FormTemplate<Schema, Type> : never
    class?: Schema extends FormSchema ? new (data?: Partial<z.infer<Schema>>) => Type : never
    onUpdate?: Schema extends FormSchema
        ? (data?: undefined extends Type ? Partial<z.infer<Schema>> : Type) => void
        : never
    onSubmit?: Schema extends FormSchema
        ? (data?: undefined extends Type ? Partial<z.infer<Schema>> : Type) => void
        : never
    onReset?: Schema extends FormSchema ? (data?: undefined extends Type ? Partial<z.infer<Schema>> : Type) => void : never
    onInvalid?: Schema extends FormSchema
        ? (error?: z.inferFormattedError<Schema>) => void
        : never
    onValid?: Schema extends FormSchema
        ? (data?: undefined extends Type ? Partial<z.infer<Schema>> : Type) => void
        : never
}

export type FormComposableOptions<Schema, Type> = FormFieldComponentOptions &
    FormComponentOptions<Schema, Type> & {
        scope?: string
    }

type FormPluginOptionsSchema<T = Partial<z.infer<FormSchema>>> = {
    schema?: FormSchema
    factory?: (data?: Partial<z.infer<FormSchema>>) => T
}

export type FormPluginOptions = FormPluginOptionsSchema &
    FormComposableOptions<FormPluginOptionsSchema['schema'], FormPluginOptionsSchema['factory']>

export type InjectedFormData<Schema extends FormSchema, Type> = {
    formData: Ref<(undefined extends Type ? Partial<z.infer<Schema>> : Type) | undefined>
    errors: Readonly<
        Ref<DeepReadonly<z.inferFormattedError<Schema>> | undefined>
    >
    submit: () => Promise<boolean>
    validate: (formData?: undefined extends Type ? Partial<z.infer<Schema>> : Type, fields?: Set<string>) => Promise<boolean>
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
    errors: Ref<Map<string, z.inferFormattedError<Schema>>>
    invalid: Readonly<Ref<boolean>>
    readonly: Readonly<Ref<boolean>>
    fields: Ref<Map<string, string>>
}

export type InjectedFormFieldData<Schema extends FormSchema> = {
    name: Readonly<Ref<Path<z.infer<Schema>>>>
    errors: Readonly<Ref<DeepReadonly<z.inferFormattedError<Schema>>>>
}

export type InjectedFormFieldsGroupData<Schema extends FormSchema> = {
    names: DeepReadonly<Ref<Path<z.infer<Schema>>[]>>
    errors: Readonly<Ref<DeepReadonly<Record<string, z.inferFormattedError<Schema>> | undefined>>>
}

export type Primitive =
    | null
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

export type AnyBoolean<Schema extends FormSchema, Type> =
    | boolean
    | Ref<boolean>
    | ((data?: InjectedFormData<Schema, Type>) => boolean | Ref<boolean>)

export type SimpleFormTemplateItem<Schema extends FormSchema, Type> = Record<
    string,
    any
> & {
    vvIs?: string | Component
    vvName?: Path<z.infer<Schema>>
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
    vvIf?: AnyBoolean<Schema, Type> | Path<z.infer<Schema>>
    vvElseIf?: AnyBoolean<Schema, Type> | Path<z.infer<Schema>>
    vvType?: `${FormFieldType}`
    vvShowValid?: boolean
    vvContent?: string
    vvDefaultValue?: any
}

export type FormTemplateItem<Schema extends FormSchema, Type> =
    | SimpleFormTemplateItem<Schema, Type>
    | ((
        data?: InjectedFormData<Schema, Type>,
        scope?: Record<string, unknown>,
    ) => SimpleFormTemplateItem<Schema, Type>)

export type FormTemplate<Schema extends FormSchema, Type> =
    | FormTemplateItem<Schema, Type>[]
    | ((
        data?: InjectedFormData<Schema, Type>,
        scope?: Record<string, unknown>,
    ) => FormTemplateItem<Schema, Type>[])

export type RenderFunctionOutput = VNode<RendererNode, RendererElement, { [key: string]: any }>
