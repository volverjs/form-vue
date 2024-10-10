import type { Component, DeepReadonly, Ref, RendererElement, RendererNode, VNode, WatchStopHandle } from 'vue'
import type { TypeOf, z } from 'zod'
import type { IgnoredUpdater } from '@vueuse/core'
import type { FormFieldType, FormStatus } from './enums'

export type FormSchema =
    | z.AnyZodObject
    | z.ZodEffects<z.AnyZodObject>
    | z.ZodEffects<z.ZodEffects<z.AnyZodObject>>

export type FormFieldComponentOptions = {
    lazyLoad?: boolean
    sideEffects?: (type: `${FormFieldType}`) => Promise<void> | void
}

export type FormComponentOptions<Schema> = {
    updateThrottle?: number
    continuousValidation?: boolean
    readonly?: boolean
    template?: Schema extends FormSchema ? FormTemplate<Schema> : never
    onUpdate?: Schema extends FormSchema
        ? (data?: Partial<z.infer<Schema>>) => void
        : never
    onSubmit?: Schema extends FormSchema
        ? (data?: z.infer<Schema>) => void
        : never
    onReset?: Schema extends FormSchema ? (data?: z.infer<Schema>) => void : never
    onInvalid?: Schema extends FormSchema
        ? (error?: z.inferFormattedError<Schema>) => void
        : never
    onValid?: Schema extends FormSchema
        ? (data?: z.infer<Schema>) => void
        : never
}

export type FormComposableOptions<Schema> = FormFieldComponentOptions &
    FormComponentOptions<Schema>

type FormPluginOptionsSchema = {
    schema?: FormSchema
}

export type FormPluginOptions = FormPluginOptionsSchema &
    FormComposableOptions<FormPluginOptionsSchema['schema']>

export type InjectedFormData<Schema extends FormSchema> = {
    formData: Ref<Partial<z.infer<Schema>> | undefined>
    errors: Readonly<
        Ref<DeepReadonly<z.inferFormattedError<Schema>> | undefined>
    >
    submit: () => Promise<boolean>
    validate: (formData?: Partial<z.infer<Schema>>, fields?: Set<string>) => Promise<boolean>
    clear: () => void
    reset: () => void
    ignoreUpdates: IgnoredUpdater
    stopUpdatesWatch: WatchStopHandle
    status: Readonly<Ref<FormStatus | undefined>>
    invalid: Readonly<Ref<boolean>>
    readonly: Ref<boolean>
}

export type InjectedFormWrapperData<Schema extends FormSchema> = {
    name: Ref<string>
    fields: Ref<Set<string>>
    errors: Ref<Map<string, z.inferFormattedError<Schema>>>
}

export type InjectedFormFieldData<Schema extends FormSchema> = {
    name: Ref<string>
    errors: Readonly<Ref<DeepReadonly<z.inferFormattedError<Schema>>>>
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

export type AnyBoolean<Schema extends FormSchema> =
    | boolean
    | Ref<boolean>
    | ((data?: InjectedFormData<Schema>) => boolean | Ref<boolean>)

export type SimpleFormTemplateItem<Schema extends FormSchema> = Record<
    string,
    any
> & {
    vvIs?: string | Component
    vvName?: Path<z.infer<Schema>>
    vvSlots?: Record<string, any>
    vvChildren?:
        | Array<
            | SimpleFormTemplateItem<Schema>
            | ((
                data?: InjectedFormData<Schema>,
                scope?: Record<string, unknown>,
            ) => SimpleFormTemplateItem<Schema>)
        >
        | ((
            data?: InjectedFormData<Schema>,
            scope?: Record<string, unknown>,
        ) => Array<
            | SimpleFormTemplateItem<Schema>
            | ((
                data?: InjectedFormData<Schema>,
                scope?: Record<string, unknown>,
            ) => SimpleFormTemplateItem<Schema>)
        >)
    vvIf?: AnyBoolean<Schema> | Path<z.infer<Schema>>
    vvElseIf?: AnyBoolean<Schema> | Path<z.infer<Schema>>
    vvType?: `${FormFieldType}`
    vvShowValid?: boolean
    vvContent?: string
    vvDefaultValue?: any
}

export type FormTemplateItem<Schema extends FormSchema> =
    | SimpleFormTemplateItem<Schema>
    | ((
        data?: InjectedFormData<Schema>,
        scope?: Record<string, unknown>,
    ) => SimpleFormTemplateItem<Schema>)

export type FormTemplate<Schema extends FormSchema> =
    | FormTemplateItem<Schema>[]
    | ((
        data?: InjectedFormData<Schema>,
        scope?: Record<string, unknown>,
    ) => FormTemplateItem<Schema>[])

export type RenderFunctionOutput = VNode<RendererNode, RendererElement, { [key: string]: any }>
