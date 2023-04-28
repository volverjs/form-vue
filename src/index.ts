import { type App, inject, type InjectionKey, type Plugin } from 'vue'
import { defineFormField } from './VvFormField'
import { defineForm } from './VvForm'
import { defineFormWrapper } from './VvFormWrapper'
import { defineFormTemplate } from './VvFormTemplate'
import type {
	InjectedFormData,
	InjectedFormWrapperData,
	InjectedFormFieldData,
	FormComposableOptions,
	FormPluginOptions,
	FormTemplateItem,
	Path,
	PathValue,
	FormSchema,
} from './types'

export const formFactory = <Schema extends FormSchema>(
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
	const { VvForm, errors, status, formData } = defineForm(
		schema,
		formInjectionKey,
		options,
	)
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
	const VvFormTemplate = defineFormTemplate(formInjectionKey, VvFormField)

	return {
		VvForm,
		VvFormWrapper,
		VvFormField,
		VvFormTemplate,
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
				if (toReturn?.VvFormTemplate) {
					app.component('VvFormTemplate', toReturn.VvFormTemplate)
				}
			}
		},
	}
}

export const useForm = <Schema extends FormSchema>(
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
type FormTemplateComponent = ReturnType<typeof defineFormTemplate>

export type {
	InjectedFormData,
	InjectedFormWrapperData,
	InjectedFormFieldData,
	FormComposableOptions,
	FormPluginOptions,
	FormComponent,
	FormWrapperComponent,
	FormFieldComponent,
	FormTemplateComponent,
	FormTemplateItem,
	Path,
	PathValue,
}
