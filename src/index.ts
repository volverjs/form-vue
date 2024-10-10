import {
    getCurrentInstance,
    type App,
    inject,
    type InjectionKey,
    type Plugin,
} from 'vue'
import type { AnyZodObject } from 'zod'
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
    FormTemplate,
} from './types'

function _formFactory<Schema extends FormSchema>(schema: Schema,	options: FormComposableOptions<Schema> = {}) {
    // create injection keys
    const formInjectionKey = Symbol('formInjectionKey') as InjectionKey<InjectedFormData<Schema>>
    const formWrapperInjectionKey = Symbol('formWrapperInjectionKey') as InjectionKey<
        InjectedFormWrapperData<Schema>
    >
    const formFieldInjectionKey = Symbol('formFieldInjectionKey') as InjectionKey<
        InjectedFormFieldData<Schema>
    >

    // create components
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
    } = defineForm(schema, formInjectionKey, options, VvFormTemplate)

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
        VvForm,
        VvFormField,
        VvFormTemplate,
        VvFormWrapper,
    }
}

export const pluginInjectionKey = Symbol('pluginInjectionKey') as InjectionKey<FormPluginOptions>

export function createForm(options: FormPluginOptions): Plugin & Partial<ReturnType<typeof useForm>> {
    let toReturn: Partial<ReturnType<typeof useForm>> = {}
    if (options.schema) {
        toReturn = _formFactory(options.schema as AnyZodObject, options)
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

export function useForm<Schema extends FormSchema>(schema: Schema,	options: FormComposableOptions<Schema> = {}) {
    if (!getCurrentInstance()) {
        return _formFactory(schema, options)
    }
    return _formFactory(
        schema as AnyZodObject,
        {
            ...inject(pluginInjectionKey, {}),
            ...options,
        } as FormComposableOptions<AnyZodObject>,
    )
}

export { FormFieldType } from './enums'
export { defaultObjectBySchema } from './utils'

type FormComponent = ReturnType<typeof defineForm>
type FormWrapperComponent = ReturnType<typeof defineFormWrapper>
type FormFieldComponent = ReturnType<typeof defineFormField>
type FormTemplateComponent = ReturnType<typeof defineFormTemplate>

export type {
    FormComponent,
    FormComposableOptions,
    FormFieldComponent,
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
export function formFactory<Schema extends FormSchema>(schema: Schema,	options: FormComposableOptions<Schema> = {}) {
    return _formFactory(schema, options)
}
