import type { Ref } from 'vue'
import type { ZodFormattedError } from 'zod'
import type { FormFieldType } from './enums'

export type FormComposableOptions = {
	lazyLoad?: boolean
	sideEffects?: (type: `${FormFieldType}`) => Promise | void
}

export type FormPluginOptions = {
	schema?: ZodSchema
} & FormComposableOptions

export type InjectedFormData<Type> = {
	modelValue: Ref<Type>
	errors: Ref<ZodFormattedError<Type>>
	submit: () => boolean
}

export type InjectedWrapperData = {
	name: Ref<string>
	fields: Ref<Set<string>>
	errors: Ref<Map<string, Record<string, { _errors: string[] }>>>
}

export type InjectedFieldData = {
	name: Ref<string>
	errors: Ref<Map<string, Record<string, { _errors: string[] }>>>
}

type CombineAll<T> = T extends { [name in keyof T]: infer Type } ? Type : never

type PropertyNameMap<T, IncludeIntermediate extends boolean> = {
	[name in keyof T]: T[name] extends object
		?
				| SubPathsOf<name, T, IncludeIntermediate>
				| (IncludeIntermediate extends true ? name : never)
		: name
}

type SubPathsOf<
	key extends keyof T,
	T,
	IncludeIntermediate extends boolean,
> = `${string & key}.${string & PathsOf<T[key], IncludeIntermediate>}`

export type PathsOf<
	T,
	IncludeIntermediate extends boolean = false,
> = CombineAll<PropertyNameMap<T, IncludeIntermediate>>
