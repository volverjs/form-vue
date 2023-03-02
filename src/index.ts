import type { App, InjectionKey } from 'vue'
import type { AnyZodObject } from 'zod'
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

export default {
	install(app: App, options: FormPluginOptions = {}) {
		app.config.globalProperties.$vvForm = options
		if (options.schema) {
			const { VvForm, VvFormWrapper, VvFormField } = useForm(
				options.schema,
				options,
			)
			app.component('VvForm', VvForm)
			app.component('VvFormWrapper', VvFormWrapper)
			app.component('VvFormField', VvFormField)
		}
	},
}

export const useForm = (
	schema: AnyZodObject,
	options: FormComposableOptions = {},
) => {
	// create injection keys form provide/inject
	const formInjectionKey = Symbol() as InjectionKey<InjectedFormData>
	const formWrapperInjectionKey =
		Symbol() as InjectionKey<InjectedFormWrapperData>

	const formFieldInjectionKey =
		Symbol() as InjectionKey<InjectedFormFieldData>

	// create components
	const VvForm = defineForm(schema, formInjectionKey, options)
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
	}
}

export { FormFieldType } from './enums'
export { defaultObjectBySchema } from './utils'

export type {
	InjectedFormData,
	InjectedFormWrapperData,
	InjectedFormFieldData,
	FormComposableOptions,
	FormPluginOptions,
}
