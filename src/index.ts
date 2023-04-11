import { type App, inject, type InjectionKey, type Plugin } from 'vue'
import type { AnyZodObject, ZodEffects } from 'zod'
import { defineFormField } from './VvFormField'
import { defineForm } from './VvForm'
import { defineFormWrapper } from './VvFormWrapper'
import type {
	InjectedFormData,
	InjectedFormWrapperData,
	InjectedFormFieldData,
	FormComposableOptions,
	FormPluginOptions,
} from './types'

export const formFactory = <
	Schema extends
		| AnyZodObject
		| ZodEffects<AnyZodObject>
		| ZodEffects<ZodEffects<AnyZodObject>>,
>(
	schema: Schema,
	options: FormComposableOptions = {},
) => {
	// create injection keys form provide/inject
	const formInjectionKey = Symbol() as InjectionKey<InjectedFormData<Schema>>
	const formWrapperInjectionKey = Symbol() as InjectionKey<
		InjectedFormWrapperData<Schema>
	>

	const formFieldInjectionKey = Symbol() as InjectionKey<
		InjectedFormFieldData<Schema>
	>

	// create components
	const {
		component: VvForm,
		errors,
		status,
		formData,
	} = defineForm(schema, formInjectionKey, options)
	const VvFormWrapper = defineFormWrapper(
		formInjectionKey,
		formWrapperInjectionKey,
	)
	const VvFormField = defineFormField(
		formInjectionKey,
		formWrapperInjectionKey,
		formFieldInjectionKey,
		options,
	)

	return {
		VvForm,
		VvFormWrapper,
		VvFormField,
		formInjectionKey,
		formWrapperInjectionKey,
		formFieldInjectionKey,
		errors,
		status,
		formData,
	}
}

export const pluginInjectionKey = Symbol() as InjectionKey<FormPluginOptions>

export const createForm = (
	options: FormPluginOptions,
): Plugin & Partial<ReturnType<typeof useForm>> => {
	let toReturn: Partial<ReturnType<typeof useForm>> = {}
	if (options.schema) {
		toReturn = formFactory(options.schema, options)
	}
	return {
		...toReturn,
		install(app: App, { global = false } = {}) {
			app.provide(pluginInjectionKey, options)

			if (global) {
				app.config.globalProperties.$vvForm = options

				if (toReturn?.VvForm) {
					app.component('VvForm', toReturn.VvForm)
				}
				if (toReturn?.VvFormWrapper) {
					app.component('VvFormWrapper', toReturn.VvFormWrapper)
				}
				if (toReturn?.VvFormField) {
					app.component('VvFormField', toReturn.VvFormField)
				}
			}
		},
	}
}

export const useForm = <
	Schema extends
		| AnyZodObject
		| ZodEffects<AnyZodObject>
		| ZodEffects<ZodEffects<AnyZodObject>>,
>(
	schema: Schema,
	options: FormComposableOptions = {},
) => {
	const hasOptions = { ...inject(pluginInjectionKey, {}), ...options }
	return formFactory(schema, hasOptions)
}

export { FormFieldType } from './enums'
export { defaultObjectBySchema } from './utils'

type FormComponent = ReturnType<typeof defineForm>
type FormWrapperComponent = ReturnType<typeof defineFormWrapper>
type FormFieldComponent = ReturnType<typeof defineFormField>

export type {
	InjectedFormData,
	InjectedFormWrapperData,
	InjectedFormFieldData,
	FormComposableOptions,
	FormPluginOptions,
	FormComponent,
	FormWrapperComponent,
	FormFieldComponent,
}
