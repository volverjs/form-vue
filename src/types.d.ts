import type { Ref } from 'vue'
import type { ZodFormattedError } from 'zod'
import type { FormFieldType } from './enums'

export type FormComposableOptions = {
	lazyLoad?: boolean
	updateThrottle?: number
	sideEffects?: (type: `${FormFieldType}`) => Promise | void
}

export type FormPluginOptions = {
	schema?: ZodSchema
} & FormComposableOptions

export type InjectedFormData<Type = Recrod<string | number, unknown>> = {
	modelValue: Ref<Type>
	errors: Ref<ZodFormattedError<Type>>
	submit: () => boolean
}

export type InjectedFormWrapperData = {
	name: Ref<string>
	fields: Ref<Set<string>>
	errors: Ref<Map<string, Record<string, { _errors: string[] }>>>
}

export type InjectedFormFieldData = {
	name: Ref<string>
	errors: Ref<Map<string, Record<string, { _errors: string[] }>>>
}
