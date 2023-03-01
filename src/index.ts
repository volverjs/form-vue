import type { App, InjectionKey } from 'vue'
import type { ZodSchema } from 'zod'
import { buildFieldComponent } from './FieldComponent'
import { buildFormComponent } from './FormComponent'
import { buildWrapperComponent } from './WrapperComponent'
import type {
	InjectedFormData,
	InjectedWrapperData,
	InjectedFieldData,
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

export const useForm = <SchemaFormData = unknown>(
	schema: ZodSchema,
	options: FormComposableOptions = {},
) => {
	// create provide / inject symbols
	const formInjectionKey = Symbol() as InjectionKey<
		InjectedFormData<SchemaFormData>
	>
	const wrapperInjectionKey = Symbol() as InjectionKey<InjectedWrapperData>

	const fieldInjectionKey = Symbol() as InjectionKey<InjectedFieldData>

	// create components
	const VvForm = buildFormComponent<SchemaFormData>(schema, formInjectionKey)
	const VvFormWrapper = buildWrapperComponent(
		formInjectionKey,
		wrapperInjectionKey,
	)
	const VvFormField = buildFieldComponent(
		formInjectionKey,
		wrapperInjectionKey,
		fieldInjectionKey,
		options,
	)

	return {
		VvForm,
		VvFormWrapper,
		VvFormField,
		formInjectionKey,
		wrapperInjectionKey,
		fieldInjectionKey,
	}
}

export { FormFieldType } from './enums'

export type {
	InjectedFormData,
	InjectedWrapperData,
	InjectedFieldData,
	FormComposableOptions,
	FormPluginOptions,
}
