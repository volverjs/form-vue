import type { App, InjectionKey, Plugin } from 'vue'
import { getCurrentInstance, inject } from 'vue'
import { defineForm } from './VvForm.js'
import { defineFormField } from './VvFormField.js'
import { defineFormFieldsGroup } from './VvFormFieldsGroup.js'
import { defineFormWrapper } from './VvFormWrapper.js'
import { defineFormTemplate } from './VvFormTemplate.js'
import type {
    InjectedFormData,
    InjectedFormWrapperData,
    InjectedFormFieldData,
    InjectedFormFieldsGroupData,
    FormComposableOptions,
    FormPluginOptions,
    FormTemplateItem,
    Path,
    PathValue,
    FormSchema,
    FormTemplate,
} from './types.js'

function _formType<Schema extends FormSchema, Type>(schema: Schema, options: FormComposableOptions<Schema, Type> = {}) {
    // create injection keys
    const formInjectionKey = Symbol('formInjectionKey') as InjectionKey<InjectedFormData<Schema, Type>>
    const formWrapperInjectionKey = Symbol('formWrapperInjectionKey') as InjectionKey<
        InjectedFormWrapperData<Schema>
    >
    const formFieldInjectionKey = Symbol('formFieldInjectionKey') as InjectionKey<
        InjectedFormFieldData<Schema>
    >
    const formFieldsGroupInjectionKey = Symbol('formFieldsGroupInjectionKey') as InjectionKey<
        InjectedFormFieldsGroupData<Schema>
    >

    // create components
    const VvFormWrapper = defineFormWrapper<Schema, Type>(
        formInjectionKey,
        formWrapperInjectionKey,
    )
    const VvFormField = defineFormField<Schema, Type>(
        formInjectionKey,
        formWrapperInjectionKey,
        formFieldInjectionKey,
        options,
    )
    const VvFormFieldsGroup = defineFormFieldsGroup<Schema, Type>(
        formInjectionKey,
        formWrapperInjectionKey,
        formFieldsGroupInjectionKey,
    )
    const VvFormTemplate = defineFormTemplate<Schema, Type>(formInjectionKey, VvFormField)
    const wrappers = new Map<string, InjectedFormWrapperData<Schema>>()
    const {
        clear,
        errors,
        formData,
        ignoreUpdates,
        invalid,
        readonly,
        reset,
        status,
        stopUpdatesWatch,
        submit,
        validate,
        VvForm,
    } = defineForm(schema, formInjectionKey, options, VvFormTemplate, wrappers)

    return {
        clear,
        errors,
        formData,
        formFieldInjectionKey,
        formInjectionKey,
        formWrapperInjectionKey,
        ignoreUpdates,
        invalid,
        readonly,
        reset,
        status,
        stopUpdatesWatch,
        submit,
        validate,
        wrappers,
        VvForm,
        VvFormField,
        VvFormFieldsGroup,
        VvFormTemplate,
        VvFormWrapper,
    }
}

export const pluginInjectionKey = Symbol('pluginInjectionKey') as InjectionKey<FormPluginOptions>

export function createForm(options: FormPluginOptions): Plugin & Partial<ReturnType<typeof useForm>> {
    let toReturn: Partial<ReturnType<typeof useForm>> = {}
    if (options.schema) {
        // @ts-expect-error - options.schema is always defined
        toReturn = _formType(options.schema, options)
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
                if (toReturn?.VvFormFieldsGroup) {
                    app.component('VvFormFieldsGroup', toReturn.VvFormFieldsGroup)
                }
                if (toReturn?.VvFormTemplate) {
                    app.component('VvFormTemplate', toReturn.VvFormTemplate)
                }
            }
        },
    }
}

// Holds the forms of every scope, whatever their schema: a scope is expected to name the
// same schema each time, so the caller's types are the ones a lookup returns.
const formInstances: Map<string, unknown> = new Map()
export function useForm<Schema extends FormSchema, Type>(schema: Schema, options: FormComposableOptions<Schema, Type> = {}): ReturnType <typeof _formType<Schema, Type>> {
    if (options.scope && formInstances.has(options.scope)) {
        return formInstances.get(options.scope) as ReturnType<typeof _formType<Schema, Type>>
    }
    if (!getCurrentInstance()) {
        const toReturn = _formType(schema, options)
        if (options.scope) {
            formInstances.set(options.scope, toReturn)
        }
        return toReturn
    }
    const toReturn = _formType(
        schema,
        {
            ...inject(pluginInjectionKey, {}),
            ...options,
        } as FormComposableOptions<Schema, Type>,
    )
    if (options.scope) {
        formInstances.set(options.scope, toReturn)
    }
    return toReturn
}

export { FormFieldType } from './enums.js'
export { defaultObjectByJSONSchema, defaultObjectBySchema } from './utils.js'

type FormComponent = ReturnType<typeof defineForm>
type FormWrapperComponent = ReturnType<typeof defineFormWrapper>
type FormFieldComponent = ReturnType<typeof defineFormField>
type FormFieldsGroupComponent = ReturnType<typeof defineFormFieldsGroup>
type FormTemplateComponent = ReturnType<typeof defineFormTemplate>

export type {
    FormComponent,
    FormComposableOptions,
    FormFieldComponent,
    FormFieldsGroupComponent,
    FormPluginOptions,
    FormSchema,
    FormTemplate,
    FormTemplateComponent,
    FormTemplateItem,
    FormWrapperComponent,
    InjectedFormData,
    InjectedFormFieldData,
    InjectedFormWrapperData,
    Path,
    PathValue,
}

/**
 * @deprecated Use `useForm()` instead
 */
export function formType<Schema extends FormSchema, Type>(schema: Schema, options: FormComposableOptions<Schema, Type> = {}) {
    return _formType(schema, options)
}
