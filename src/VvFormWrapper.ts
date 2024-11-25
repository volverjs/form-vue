import {
    type DeepReadonly,
    type InjectionKey,
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
    ref,
    toRefs,
    watch,
} from 'vue'
import type { inferFormattedError, z } from 'zod'
import type {
    FormSchema,
    InjectedFormData,
    InjectedFormWrapperData,
} from './types'

export function defineFormWrapper<Schema extends FormSchema, Type>(formProvideKey: InjectionKey<InjectedFormData<Schema, Type>>, wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>) {
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
        },
        emits: ['invalid', 'valid'],
        expose: [
            'clear',
            'errors',
            'fields',
            'fieldsErrors',
            'formData',
            'invalid',
            'reset',
            'submit',
            'tag',
            'validate',
            'validateWrapper',
        ],
        slots: Object as SlotsType<{
            default: {
                errors?: DeepReadonly<z.inferFormattedError<Schema>>
                formData?: undefined extends Type ? Partial<z.infer<Schema>> : Type
                formErrors?: DeepReadonly<inferFormattedError<Schema, string>>
                invalid: boolean
                submit?: InjectedFormData<Schema, Type>['submit']
                validate?: InjectedFormData<Schema, Type>['validate']
                validateWrapper?: () => Promise<boolean>
                fieldsErrors: Map<string, inferFormattedError<Schema, string>>
                clear?: InjectedFormData<Schema, Type>['clear']
                reset?: InjectedFormData<Schema, Type>['reset']
            }
        }>,
        setup(props, { emit }) {
            const injectedFormData = inject(formProvideKey)
            const wrapperProvided = inject(wrapperProvideKey, undefined)
            const fields = ref(new Map<string, string>())
            const fieldsErrors: Ref<
                Map<string, z.inferFormattedError<Schema>>
            > = ref(new Map())
            const { name } = toRefs(props)

            // invalid
            const invalid = computed(() => {
                if (!injectedFormData?.invalid.value) {
                    return false
                }
                return fieldsErrors.value.size > 0
            })
            watch(invalid, () => {
                if (invalid.value) {
                    emit('invalid')
                }
                else {
                    emit('valid')
                }
            })

            // provide data to child fields
            const providedData = {
                name: readonly(name),
                errors: fieldsErrors,
                invalid: readonly(invalid),
                fields,
            }
            provide(wrapperProvideKey, providedData)

            // add fields to parent wrapper
            watch(
                fields,
                (newValue, oldValue) => {
                    if (wrapperProvided?.fields) {
                        oldValue.entries().forEach(([id]) => {
                            if (!newValue.has(id)) {
                                wrapperProvided?.fields.value.delete(id)
                            }
                        })
                    }
                    if (wrapperProvided?.fields) {
                        newValue.entries().forEach(([id, field]) => {
                            if (!wrapperProvided?.fields.value.has(id)) {
                                wrapperProvided?.fields.value.set(id, field)
                            }
                        })
                    }
                },
                { deep: true },
            )

            // add fields errors to parent wrapper
            watch(
                fieldsErrors,
                (newValue, oldValue) => {
                    if (wrapperProvided?.errors) {
                        Array.from(oldValue.keys()).forEach((key) => {
                            wrapperProvided.errors.value.delete(key)
                        })
                        Array.from(newValue.keys()).forEach((key) => {
                            const value = newValue.get(key)
                            if (value) {
                                wrapperProvided.errors.value.set(key, value)
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
                clear: injectedFormData?.clear,
                errors: injectedFormData?.errors,
                fields,
                fieldsErrors,
                formData: injectedFormData?.formData,
                invalid,
                reset: injectedFormData?.reset,
                submit: injectedFormData?.submit,
                validate: injectedFormData?.validate,
                validateWrapper,
            }
        },
        render() {
            const defaultSlot = () =>
                this.$slots.default?.({
                    clear: this.clear,
                    errors: this.errors,
                    fieldsErrors: this.fieldsErrors,
                    formData: this.formData,
                    invalid: this.invalid,
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
