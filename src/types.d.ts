import type { Ref } from 'vue'
import type { z, AnyZodObject, ZodEffects } from 'zod'
import type { FormFieldType } from './enums'

export type FormComposableOptions = {
	lazyLoad?: boolean
	updateThrottle?: number
	continuosValidation?: boolean
	sideEffects?: (type: `${FormFieldType}`) => Promise | void
}

export type FormPluginOptions = {
	schema?: ZodSchema
} & FormComposableOptions

export type InjectedFormData<
	Schema extends
		| AnyZodObject
		| ZodEffects<AnyZodObject>
		| ZodEffects<ZodEffects<AnyZodObject>>,
> = {
	modelValue: Ref<Partial<z.infer<Schema>> | undefined>
	errors: Readonly<Ref<DeepReadonly<z.inferFormattedError<Schema>>>>
	submit: () => boolean
}

export type InjectedFormWrapperData<
	Schema extends
		| AnyZodObject
		| ZodEffects<AnyZodObject>
		| ZodEffects<ZodEffects<AnyZodObject>>,
> = {
	name: Ref<string>
	fields: Ref<Set<string>>
	errors: Readonly<Ref<DeepReadonly<z.inferFormattedError<Schema>>>>
}

export type InjectedFormFieldData<
	Schema extends
		| AnyZodObject
		| ZodEffects<AnyZodObject>
		| ZodEffects<ZodEffects<AnyZodObject>>,
> = {
	name: Ref<string>
	errors: Readonly<Ref<DeepReadonly<z.inferFormattedError<Schema>>>>
}
