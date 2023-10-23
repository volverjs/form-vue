import type { Component, DeepReadonly, Ref, WatchStopHandle } from 'vue'
import type { z, AnyZodObject, ZodEffects, inferFormattedError } from 'zod'
import type { IgnoredUpdater } from '@vueuse/core'
import type { FormFieldType, FormStatus } from './enums'

export type FormSchema =
	| AnyZodObject
	| ZodEffects<AnyZodObject>
	| ZodEffects<ZodEffects<AnyZodObject>>

export type FormFieldComponentOptions = {
	lazyLoad?: boolean
	sideEffects?: (type: `${FormFieldType}`) => Promise<void> | void
}

export type FormComponentOptions<Schema> = {
	updateThrottle?: number
	continuosValidation?: boolean
	template?: Schema extends FormSchema ? FormTemplate<Schema> : never
	onUpdate?: Schema extends FormSchema
		? (data: Partial<z.infer<Schema> | undefined>) => void
		: never
	onSubmit?: Schema extends FormSchema
		? (data: z.infer<Schema>) => void
		: never
	onInvalid?: Schema extends FormSchema
		? (error: inferFormattedError<Schema, string>) => void
		: never
	onValid?: Schema extends FormSchema
		? (data: z.infer<Schema>) => void
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
	validate: () => Promise<boolean>
	ignoreUpdates: IgnoredUpdater
	stopUpdatesWatch: WatchStopHandle
	status: Readonly<Ref<FormStatus | undefined>>
	invalid: Readonly<Ref<boolean>>
}

export type InjectedFormWrapperData<Schema extends FormSchema> = {
	name: Ref<string>
	fields: Ref<Set<string>>
	errors: Ref<Map<string, z.inferFormattedError<Schema, string>>>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsTuple<T extends readonly any[]> = number extends T['length']
	? false
	: true

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any
> & {
	vvIs?: string | Component
	vvName?: Path<z.infer<Schema>>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	vvSlots?: Record<string, any>
	vvChildren?: Array<
		| SimpleFormTemplateItem<Schema>
		| ((data?: InjectedFormData<Schema>) => SimpleFormTemplateItem<Schema>)
	>
	vvIf?: AnyBoolean<Schema> | Path<z.infer<Schema>>
	vvElseIf?: AnyBoolean<Schema> | Path<z.infer<Schema>>
	vvType?: `${FormFieldType}`
	vvShowValid?: boolean
	vvContent?: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	vvDefaultValue?: any
}

export type FormTemplateItem<Schema extends FormSchema> =
	| SimpleFormTemplateItem<Schema>
	| ((data?: InjectedFormData<Schema>) => SimpleFormTemplateItem<Schema>)

export type FormTemplate<Schema extends FormSchema> =
	| FormTemplateItem<Schema>[]
	| ((data?: InjectedFormData<Schema>) => FormTemplateItem<Schema>[])
