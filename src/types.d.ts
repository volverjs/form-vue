import type { Ref } from 'vue'
import type { z, AnyZodObject, ZodEffects } from 'zod'
import type { FormFieldType, FormStatus } from './enums'

export type FormSchema =
	| AnyZodObject
	| ZodEffects<AnyZodObject>
	| ZodEffects<ZodEffects<AnyZodObject>>

export type FormFieldComponentOptions = {
	lazyLoad?: boolean
	sideEffects?: (type: `${FormFieldType}`) => Promise | void
}

export type FormComponentOptions = {
	updateThrottle?: number
	continuosValidation?: boolean
}

export type FormComposableOptions = FormFieldComponentOptions &
	FormComponentOptions

export type FormPluginOptions = {
	schema?: ZodSchema
} & FormComposableOptions

export type InjectedFormData<Schema extends FormSchema> = {
	formData: Ref<Partial<z.infer<Schema>> | undefined>
	errors: Readonly<Ref<DeepReadonly<z.inferFormattedError<Schema>>>>
	submit: () => boolean
	validate: () => boolean
	status: Readonly<Ref<FormStatus | undefined>>
	invalid: Readonly<Ref<boolean>>
}

export type InjectedFormWrapperData<Schema extends FormSchema> = {
	name: Ref<string>
	fields: Ref<Set<string>>
	errors: Readonly<Ref<DeepReadonly<z.inferFormattedError<Schema>>>>
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

type ArrayKey = number

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
		: PathConcat<ArrayKey, V>
	: {
			[K in keyof T]-?: PathConcat<K & string, T[K]>
	  }[keyof T]
	  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PathValue<T, TPath extends Path<T> | ArrayPath<T>> = T extends any
	? TPath extends `${infer K}.${infer R}`
		? K extends keyof T
			? R extends Path<T[K]>
				? undefined extends T[K]
					? PathValue<T[K], R> | undefined
					: PathValue<T[K], R>
				: never
			: K extends `${ArrayKey}`
			? T extends readonly (infer V)[]
				? PathValue<V, R & Path<V>>
				: never
			: never
		: TPath extends keyof T
		? T[TPath]
		: TPath extends `${ArrayKey}`
		? T extends readonly (infer V)[]
			? V
			: never
		: never
	: never

export type AnyBoolean<Schema> =
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	vvDefaultValue?: any
}

export type FormTemplateItem<Schema extends FormSchema> =
	| SimpleFormTemplateItem<Schema>
	| ((data?: InjectedFormData<Schema>) => SimpleFormTemplateItem<Schema>)
