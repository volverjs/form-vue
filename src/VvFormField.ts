import type { Component, ConcreteComponent, DeepReadonly, InjectionKey, PropType, Ref, SlotsType } from 'vue'
import type {
    FormFieldComponentOptions,
    FormSchema,
    InjectedFormData,
    InjectedFormFieldData,
    InjectedFormWrapperData,
    Path,
    InferSchema,
    InferFormattedError,
} from './types'
import { getProperty, setProperty } from 'dot-prop'
import {
    computed,
    defineAsyncComponent,
    defineComponent,
    h,
    inject,
    onBeforeUnmount,
    onMounted,
    provide,
    readonly,
    resolveComponent,
    toRefs,
    unref,
    watch,
    useId,
} from 'vue'
import { FormFieldType } from './enums'

export function defineFormField<Schema extends FormSchema, Type = undefined>(formProvideKey: InjectionKey<InjectedFormData<Schema, Type>>, wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>, formFieldInjectionKey: InjectionKey<InjectedFormFieldData<Schema>>, options?: FormFieldComponentOptions) {
    return defineComponent({
        name: 'VvFormField',
        props: {
            type: {
                type: String as PropType<`${FormFieldType}`>,
                validator: (value: FormFieldType) => {
                    return Object.values(FormFieldType).includes(value)
                },
                default: FormFieldType.custom,
            },
            is: {
                type: [Object, String] as PropType<Component | string>,
                default: undefined,
            },
            name: {
                type: [String, Number, Boolean, Symbol] as PropType<
                    Path<InferSchema<Schema>>
                >,
                required: true,
            },
            props: {
                type: [Object, Function] as PropType<
                    Partial<
                        | InferSchema<Schema>
                        | undefined
                        | ((
                            formData?: Ref<ObjectConstructor>,
                        ) => Partial<InferSchema<Schema>> | undefined)
                    >
                >,
                default: () => ({}),
            },
            showValid: {
                type: Boolean,
                default: false,
            },
            defaultValue: {
                type: [String, Number, Boolean, Array, Object],
                default: undefined,
            },
            lazyLoad: {
                type: Boolean,
                default: false,
            },
            readonly: {
                type: Boolean,
                default: undefined,
            },
        },
        emits: [
            'invalid',
            'update:formData',
            'update:modelValue',
            'valid',
        ],
        expose: [
            'component',
            'errors',
            'hasProps',
            'invalid',
            'invalidLabel',
            'is',
            'type',
        ],
        slots: Object as SlotsType<{
            [key: string]: any
            default: {
                errors: DeepReadonly<InferFormattedError<Schema> | undefined>
                formData?: undefined extends Type ? Partial<InferSchema<Schema>> : Type
                formErrors?: DeepReadonly<InferFormattedError<Schema>>
                invalid: boolean
                invalidLabel?: string[]
                modelValue: any
                readonly: boolean
                onUpdate: (value: unknown) => void
                submit?: InjectedFormData<Schema, Type>['submit']
                validate?: InjectedFormData<Schema, Type>['validate']
            }
        }>,
        setup(props, { slots, emit }) {
            const { props: fieldProps, name: fieldName } = toRefs(props)
            const fieldId = useId()

            // inject data from parent form wrapper
            const injectedWrapperData = inject(wrapperProvideKey, undefined)
            if (injectedWrapperData) {
                injectedWrapperData.fields.value.set(fieldId, props.name as string)
            }

            // inject data from parent form
            const injectedFormData = inject(formProvideKey)

            // v-model
            const modelValue = computed({
                get() {
                    if (!injectedFormData?.formData) {
                        return
                    }
                    return getProperty(
                        new Object(injectedFormData.formData.value),
                        String(props.name),
                    )
                },
                set(value) {
                    if (!injectedFormData?.formData) {
                        return
                    }
                    setProperty(
                        new Object(injectedFormData.formData.value),
                        String(props.name),
                        value,
                    )
                    emit('update:modelValue', {
                        newValue: modelValue.value,
                        formData: injectedFormData?.formData,
                    })
                },
            })
            onMounted(() => {
                if (
                    modelValue.value === undefined
                    && props.defaultValue !== undefined
                ) {
                    modelValue.value = props.defaultValue
                }
            })
            onBeforeUnmount(() => {
                if (injectedWrapperData) {
                    injectedWrapperData.fields.value.delete(fieldId)
                }
            })

            const errors = computed(() => {
                if (!injectedFormData?.errors.value) {
                    return undefined
                }
                return getProperty(injectedFormData.errors.value, String(props.name)) as InferFormattedError<Schema> | undefined
            })
            const invalidLabel = computed(() => {
                return errors.value?._errors
            })
            const isInvalid = computed(() => {
                return errors.value !== undefined
            })
            const unwatchInvalid = watch(isInvalid, (newValue) => {
                if (newValue) {
                    emit('invalid', errors.value)
                    if (injectedWrapperData) {
                        injectedWrapperData.errors.value.set(
                            String(props.name),
                            errors.value,
                        )
                    }
                    return
                }
                emit('valid', modelValue.value)
                if (injectedWrapperData) {
                    injectedWrapperData.errors.value.delete(
                        props.name as string,
                    )
                }
            })
            const unwatchInjectedFormData = watch(
                () => injectedFormData?.formData,
                () => {
                    emit('update:formData', injectedFormData?.formData)
                },
                { deep: true },
            )
            onBeforeUnmount(() => {
                unwatchInvalid()
                unwatchInjectedFormData()
            })
            const onUpdate = (value: unknown) => {
                if (value instanceof InputEvent) {
                    value = (value.target as HTMLInputElement).value
                }
                modelValue.value = value
            }
            const hasFieldProps = computed(() => {
                let toReturn = fieldProps.value
                if (typeof toReturn === 'function') {
                    toReturn = toReturn(injectedFormData?.formData)
                }
                return Object.keys(toReturn).reduce<Record<string, unknown>>(
                    (acc, key) => {
                        acc[key] = unref(toReturn[key])
                        return acc
                    },
                    {},
                )
            })
            const isReadonly = computed(() => {
                if (injectedFormData?.readonly.value) {
                    return true
                }
                if (injectedWrapperData?.readonly.value) {
                    return true
                }
                return (hasFieldProps.value.readonly ?? props.readonly) as boolean
            })
            const hasProps = computed(() => ({
                ...hasFieldProps.value,
                'name': hasFieldProps.value.name ?? props.name,
                'invalid': isInvalid.value,
                'valid': props.showValid
                    ? Boolean(!isInvalid.value && modelValue.value)
                    : undefined,
                'type': ((type: FormFieldType) => {
                    if (
                        [
                            FormFieldType.color,
                            FormFieldType.date,
                            FormFieldType.datetimeLocal,
                            FormFieldType.email,
                            FormFieldType.month,
                            FormFieldType.number,
                            FormFieldType.password,
                            FormFieldType.search,
                            FormFieldType.tel,
                            FormFieldType.text,
                            FormFieldType.time,
                            FormFieldType.url,
                            FormFieldType.week,
                        ].includes(type)
                    ) {
                        return type
                    }
                    return undefined
                })(props.type as FormFieldType),
                'invalidLabel': invalidLabel.value,
                'modelValue': modelValue.value,
                'readonly': isReadonly.value,
                'onUpdate:modelValue': onUpdate,
            }))

            // provide data to children
            provide(formFieldInjectionKey, {
                name: readonly(fieldName) as Readonly<Ref<Path<InferSchema<Schema>>>>,
                errors: readonly(errors),
            })

            // load component
            const component = computed(() => {
                if (props.type === FormFieldType.custom) {
                    return {
                        render() {
                            return (
                                slots.default?.({
                                    errors: readonly(errors).value,
                                    formData: injectedFormData?.formData.value,
                                    formErrors: injectedFormData?.errors.value,
                                    invalid: isInvalid.value,
                                    invalidLabel: invalidLabel.value,
                                    modelValue: modelValue.value,
                                    readonly: isReadonly.value,
                                    onUpdate,
                                    submit: injectedFormData?.submit,
                                    validate: injectedFormData?.validate,
                                }) ?? slots.default
                            )
                        },
                    }
                }
                if (!(options?.lazyLoad ?? props.lazyLoad)) {
                    let component: string | ConcreteComponent
                    switch (props.type) {
                        case FormFieldType.select:
                            component = resolveComponent('VvSelect')
                            break
                        case FormFieldType.checkbox:
                            component = resolveComponent('VvCheckbox')
                            break
                        case FormFieldType.radio:
                            component = resolveComponent('VvRadio')
                            break
                        case FormFieldType.textarea:
                            component = resolveComponent('VvTextarea')
                            break
                        case FormFieldType.radioGroup:
                            component = resolveComponent('VvRadioGroup')
                            break
                        case FormFieldType.checkboxGroup:
                            component = resolveComponent('VvCheckboxGroup')
                            break
                        case FormFieldType.combobox:
                            component = resolveComponent('VvCombobox')
                            break
                        default:
                            component = resolveComponent('VvInputText')
                    }
                    if (typeof component !== 'string') {
                        return component
                    }
                    console.warn(
                        `[@volverjs/form-vue]: ${component} not found, the component will be loaded asynchronously. To avoid this warning, please set "lazyLoad" option.`,
                    )
                }
                return defineAsyncComponent(async () => {
                    if (options?.sideEffects) {
                        await Promise.resolve(options.sideEffects(props.type))
                    }
                    switch (props.type) {
                        case FormFieldType.textarea:
                            return import(
                                '@volverjs/ui-vue/vv-textarea',
                            ) as Component
                        case FormFieldType.radio:
                            return import(
                                '@volverjs/ui-vue/vv-radio',
                            ) as Component
                        case FormFieldType.radioGroup:
                            return import(
                                '@volverjs/ui-vue/vv-radio-group',
                            ) as Component
                        case FormFieldType.checkbox:
                            return import(
                                '@volverjs/ui-vue/vv-checkbox',
                            ) as Component
                        case FormFieldType.checkboxGroup:
                            return import(
                                '@volverjs/ui-vue/vv-checkbox-group',
                            ) as Component
                        case FormFieldType.select:
                            return import(
                                '@volverjs/ui-vue/vv-select',
                            ) as Component
                        case FormFieldType.combobox:
                            return import(
                                '@volverjs/ui-vue/vv-combobox',
                            ) as Component
                    }
                    return import('@volverjs/ui-vue/vv-input-text') as Component
                })
            })

            return { component, hasProps, invalid: isInvalid }
        },
        render() {
            if (this.is) {
                return h(this.is, this.hasProps, this.$slots)
            }
            if (this.type === FormFieldType.custom) {
                return h(this.component, null, this.$slots)
            }
            return h(this.component, this.hasProps, this.$slots)
        },
    })
}
