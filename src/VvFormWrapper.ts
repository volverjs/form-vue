import type { DeepReadonly, InjectionKey, Ref, SlotsType } from 'vue'
import type { z } from 'zod'
import type {
    FormSchema,
    InjectedFormData,
    InjectedFormWrapperData,
} from './types'
import {
    computed,
    defineComponent,
    h,
    inject,
    onBeforeUnmount,
    onMounted,
    provide,
    readonly,
    ref,
    toRefs,
    watch,
} from 'vue'

export function defineFormWrapper<Schema extends FormSchema, Type = undefined>(formProvideKey: InjectionKey<InjectedFormData<Schema, Type>>, wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>) {
    return defineComponent({
        name: 'VvFormWrapper',
        props: {
            name: {
                type: String,
                required: true,
            },
            tag: {
                type: String,
                default: undefined,
            },
            readonly: {
                type: Boolean,
                default: false,
            },
        },
        emits: ['invalid', 'valid'],
        expose: [
            'clear',
            'errors',
            'fields',
            'fieldsErrors',
            'formData',
            'invalid',
            'readonly',
            'reset',
            'submit',
            'tag',
            'validate',
            'validateWrapper',
        ],
        slots: Object as SlotsType<{
            default: {
                errors?: DeepReadonly<z.inferFormattedError<Schema>>
                fieldsErrors: Map<string, z.inferFormattedError<Schema>>
                formData?: undefined extends Type ? Partial<z.infer<Schema>> : Type
                formErrors?: DeepReadonly<z.inferFormattedError<Schema>>
                invalid: boolean
                readonly: boolean
                clear?: InjectedFormData<Schema, Type>['clear']
                reset?: InjectedFormData<Schema, Type>['reset']
                submit?: InjectedFormData<Schema, Type>['submit']
                validate?: InjectedFormData<Schema, Type>['validate']
                validateWrapper?: () => Promise<boolean>
            }
        }>,
        setup(props, { emit }) {
            // inject data from parent form
            const injectedFormData = inject(formProvideKey)
            // inject data from parent form wrapper
            const injectedWrapperData = inject(wrapperProvideKey, undefined)
            const fields: Ref<Map<string, string>> = ref(new Map())
            const fieldsErrors: Ref<
                Map<string, z.inferFormattedError<Schema>>
            > = ref(new Map())
            const { name } = toRefs(props)

            // invalid
            const isInvalid = computed(() => {
                if (!injectedFormData?.invalid.value) {
                    return false
                }
                return fieldsErrors.value.size > 0
            })
            watch(isInvalid, (newValue) => {
                if (newValue) {
                    emit('invalid')
                    return
                }
                emit('valid')
            })

            // readonly
            const isReadonly = computed(() => injectedFormData?.readonly.value || props.readonly)

            // provide data to child fields
            const providedData = {
                name: readonly(name),
                errors: fieldsErrors,
                invalid: readonly(isInvalid),
                readonly: readonly(isReadonly),
                fields,
            }
            provide(wrapperProvideKey, providedData)

            // add fields to parent wrapper
            const computedFields = computed(() => new Map(fields.value))
            watch(
                computedFields,
                (newValue, oldValue) => {
                    if (injectedWrapperData?.fields) {
                        oldValue.forEach((_field, key) => {
                            if (!newValue.has(key)) {
                                injectedWrapperData?.fields.value.delete(key)
                            }
                        })
                        newValue.forEach((field, key) => {
                            if (!injectedWrapperData?.fields.value.has(key)) {
                                injectedWrapperData?.fields.value.set(key, field)
                            }
                        })
                    }
                },
                { deep: true },
            )

            // add fields errors to parent wrapper
            watch(
                fieldsErrors,
                (newValue) => {
                    if (injectedWrapperData?.errors) {
                        fields.value.forEach((field) => {
                            if (!newValue.has(field)) {
                                injectedWrapperData.errors.value.delete(field)
                            }
                            if (newValue.has(field)) {
                                const value = newValue.get(field)
                                if (value) {
                                    injectedWrapperData.errors.value.set(field, value)
                                }
                            }
                        })
                    }
                },
                { deep: true },
            )

            onMounted(() => {
                if (!injectedFormData?.wrappers || !name.value) {
                    console.warn('[@volverjs/form-vue]: Invalid wrapper registration state')
                    return
                }
                if (injectedFormData.wrappers.has(name.value)) {
                    console.warn(`[@volverjs/form-vue]: wrapper name "${name.value}" is already used`)
                    return
                }
                injectedFormData.wrappers.set(name.value, providedData)
            })
            onBeforeUnmount(() => {
                if (injectedFormData?.wrappers && name.value) {
                    injectedFormData.wrappers.delete(name.value)
                }
            })

            const validateWrapper = () => {
                return injectedFormData?.validate(undefined, new Set(fields.value.values())) ?? Promise.resolve(true)
            }

            return {
                errors: injectedFormData?.errors,
                fields,
                fieldsErrors,
                formData: injectedFormData?.formData,
                invalid: isInvalid,
                readonly: isReadonly,
                clear: injectedFormData?.clear,
                reset: injectedFormData?.reset,
                submit: injectedFormData?.submit,
                validate: injectedFormData?.validate,
                validateWrapper,
            }
        },
        render() {
            const defaultSlot = () =>
                this.$slots.default?.({
                    errors: this.errors,
                    fieldsErrors: this.fieldsErrors,
                    formData: this.formData,
                    invalid: this.invalid,
                    readonly: this.readonly,
                    clear: this.clear,
                    reset: this.reset,
                    submit: this.submit,
                    validate: this.validate,
                    validateWrapper: this.validateWrapper,
                })
            if (this.tag) {
                return h(this.tag, null, {
                    default: defaultSlot,
                })
            }
            return defaultSlot()
        },
    })
}
