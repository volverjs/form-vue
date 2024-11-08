import { get, set } from 'ts-dot-prop'
import {
    type Component,
    type DeepReadonly,
    type InjectionKey,
    type PropType,
    type Ref,
    type SlotsType,
    computed,
    defineComponent,
    h,
    inject,
    onBeforeUnmount,
    onMounted,
    provide,
    readonly,
    toRefs,
    unref,
    watch,
} from 'vue'
import type { inferFormattedError, TypeOf, z } from 'zod'
import type {
    FormSchema,
    InjectedFormData,
    InjectedFormFieldsGroupData,
    InjectedFormWrapperData,
    Path,
} from './types'

export function defineFormFieldsGroup<Schema extends FormSchema>(formProvideKey: InjectionKey<InjectedFormData<Schema>>, wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>, formFieldsGroupInjectionKey: InjectionKey<InjectedFormFieldsGroupData<Schema>>) {
    return defineComponent({
        name: 'VvFormFieldsGroup',
        props: {
            is: {
                type: [Object, String] as PropType<Component | string>,
                default: undefined,
            },
            names: {
                type: [Array, Object] as PropType<
                    Path<z.infer<Schema>>[] | Record<string, Path<z.infer<Schema>>>
                >,
                required: true,
            },
            props: {
                type: [Object, Function] as PropType<
                    Partial<
                        | z.infer<Schema>
                        | undefined
                        | ((
                            formData?: Ref<ObjectConstructor>,
                        ) => Partial<z.infer<Schema>> | undefined)
                    >
                >,
                default: () => ({}),
            },
            showValid: {
                type: Boolean,
                default: false,
            },
            defaultValues: {
                type: [Object] as PropType<
                    Record<Path<z.infer<Schema>>, any>
                >,
                default: undefined,
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
            'invalidLabels',
            'is',
        ],
        slots: Object as SlotsType<{
            [key: string]: any
            default: {
                errors?: Record<Path<z.infer<Schema>>, z.inferFormattedError<Schema>>
                formData?: Partial<TypeOf<Schema>>
                formErrors?: DeepReadonly<inferFormattedError<Schema, string>>
                invalid: boolean
                invalids: Record<string, boolean>
                invalidLabels?: Record<string, string[]>
                modelValue: Record<string, any>
                onUpdate: (value: Record<string, any>) => void
                onUpdateField: (name: string, value: any) => void
                readonly: boolean
                submit?: InjectedFormData<Schema>['submit']
                validate?: InjectedFormData<Schema>['validate']
            }
        }>,
        setup(props, { slots, emit }) {
            const { props: fieldProps, names: fieldsNames, defaultValues } = toRefs(props)
            const names = computed<Path<z.infer<Schema>>[]>(() => {
                if (Array.isArray(fieldsNames.value)) {
                    return fieldsNames.value
                }
                return Object.values(fieldsNames.value)
            })
            const namesKeys = computed(() => {
                if (Array.isArray(fieldsNames.value)) {
                    return fieldsNames.value
                }
                return Object.keys(fieldsNames.value)
            })
            const namesMap = computed(() => {
                if (Array.isArray(fieldsNames.value)) {
                    return fieldsNames.value.reduce<Record<string, Path<z.infer<Schema>>>>((
                        acc,
                        name,
                    ) => {
                        acc[String(name)] = name
                        return acc
                    }, {})
                }
                return fieldsNames.value
            })
            const namesKeysMap = computed(() => {
                return Object.keys(namesMap.value).reduce<Record<string, string>>((acc, key) => {
                    acc[String(namesMap.value[key])] = key
                    return acc
                }, {})
            })

            // inject data from parent form wrapper
            const injectedWrapperData = inject(wrapperProvideKey, undefined)
            if (injectedWrapperData) {
                names.value.forEach((name) => {
                    injectedWrapperData.fields.value.add(name as string)
                })
            }

            // inject data from parent form
            const injectedFormData = inject(formProvideKey)

            // v-model
            const modelValue = computed({
                get() {
                    if (!injectedFormData?.formData) {
                        return {}
                    }
                    return namesKeys.value.reduce<Record<string, any>>((acc, nameKey) => {
                        acc[nameKey] = get(
                            new Object(injectedFormData.formData.value),
                            namesMap.value[nameKey],
                        )
                        return acc
                    }, {})
                },
                set(value) {
                    if (!injectedFormData?.formData) {
                        return
                    }
                    namesKeys.value.forEach((nameKey) => {
                        set(
                            new Object(injectedFormData.formData.value),
                            namesMap.value[nameKey],
                            value?.[nameKey],
                        )
                    })
                    emit('update:modelValue', {
                        newValue: modelValue.value,
                        formData: injectedFormData?.formData,
                    })
                },
            })
            onMounted(() => {
                if (
                    defaultValues.value
                ) {
                    names.value.forEach((name) => {
                        if (defaultValues.value?.[name] === undefined) {
                            return
                        }
                        if (modelValue.value[name] !== undefined) {
                            return
                        }
                        modelValue.value = {
                            ...modelValue.value,
                            [name]: defaultValues.value?.[name],
                        }
                    })
                }
            })

            const errors = computed(() => {
                if (!injectedFormData?.errors.value) {
                    return undefined
                }
                const toReturn = names.value.reduce<Record<string, z.inferFormattedError<Schema>>>((acc, name) => {
                    if (!injectedFormData.errors.value) {
                        return acc
                    }
                    const error = get(injectedFormData.errors.value, String(name))
                    if (error === undefined) {
                        return acc
                    }
                    acc[String(name)] = error
                    return acc
                }, {})
                if (Object.keys(toReturn).length === 0) {
                    return undefined
                }
                return toReturn
            })
            const invalidLabels = computed(() => {
                if (!errors.value) {
                    return
                }
                const toReturn = Object.keys(errors.value).reduce<Record<string, string[]>>((acc, name) => {
                    if (!errors.value?.[name]) {
                        return acc
                    }
                    acc[namesKeysMap.value[name]] = errors.value[name]._errors
                    return acc
                }, {})
                if (Object.keys(toReturn).length === 0) {
                    return
                }
                return toReturn
            })
            const invalid = computed(() => {
                return errors.value !== undefined
            })
            const invalids = computed(() => {
                return namesKeys.value.reduce<Record<string, boolean>>((acc, name) => {
                    acc[name] = Boolean(errors.value?.[namesKeysMap.value[name]])
                    return acc
                }, {})
            })
            const unwatchInvalid = watch(invalid, () => {
                if (invalid.value) {
                    emit('invalid', errors.value)
                    if (injectedWrapperData) {
                        names.value.forEach((name) => {
                            if (!errors.value?.[name]) {
                                injectedWrapperData.errors.value.delete(
                                    name,
                                )
                                return
                            }
                            injectedWrapperData.errors.value.set(
                                name,
                                errors.value?.[name],
                            )
                        })
                    }
                    return
                }
                emit('valid', modelValue.value)
                if (injectedWrapperData) {
                    names.value.forEach((name) => {
                        injectedWrapperData.errors.value.delete(
                            name,
                        )
                    })
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
            const onUpdate = (value: Record<string, any>) => {
                modelValue.value = value
            }
            const onUpdateField = (name: string, value: unknown) => {
                if (value instanceof InputEvent) {
                    value = (value.target as HTMLInputElement).value
                }
                if (!namesKeys.value.includes(name)) {
                    return
                }
                modelValue.value = {
                    ...modelValue.value,
                    [name]: value,
                }
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
                return (hasFieldProps.value.readonly ?? props.readonly) as boolean
            })
            const onUpdateEvents = computed(() => {
                return namesKeys.value.reduce<Record<string, (value: any) => void>>((acc, name) => {
                    acc[`onUpdate:${name}`] = (value) => {
                        onUpdateField(name, value)
                    }
                    return acc
                }, {
                    'onUpdate:modelValue': onUpdate,
                })
            })
            const hasProps = computed(() => ({
                ...onUpdateEvents.value,
                ...hasFieldProps.value,
                names: hasFieldProps.value.name ?? names.value,
                invalid: invalid.value,
                invalids: invalids.value,
                valid: props.showValid
                    ? Boolean(!invalid.value && modelValue.value)
                    : undefined,
                invalidLabels: invalidLabels.value,
                modelValue: modelValue.value,
                readonly: isReadonly.value,
            }))

            // provide data to children
            provide(formFieldsGroupInjectionKey, {
                names: readonly(fieldsNames) as DeepReadonly<Ref<Path<z.infer<Schema>>[]>>,
                errors: readonly(errors),
            })

            // define component
            const component = computed(() => ({
                render() {
                    return (
                        slots.default?.({
                            errors: errors.value,
                            formData: injectedFormData?.formData.value,
                            formErrors: injectedFormData?.errors.value,
                            invalid: invalid.value,
                            invalids: invalids.value,
                            invalidLabels: invalidLabels.value,
                            modelValue: modelValue.value,
                            onUpdate,
                            onUpdateField,
                            readonly: isReadonly.value,
                            submit: injectedFormData?.submit,
                            validate: injectedFormData?.validate,
                        }) ?? slots.default
                    )
                },
            }))

            return { component, hasProps, invalid }
        },
        render() {
            if (this.is) {
                return h(this.is, this.hasProps, this.$slots)
            }
            return h(this.component, null, this.$slots)
        },
    })
}
