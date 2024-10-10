import {
    type DeepReadonly,
    type InjectionKey,
    type Ref,
    type SlotsType,
    computed,
    defineComponent,
    h,
    inject,
    provide,
    readonly,
    ref,
    toRefs,
    watch,
} from 'vue'
import type { inferFormattedError, TypeOf, z } from 'zod'
import type {
    FormSchema,
    InjectedFormData,
    InjectedFormWrapperData,
} from './types'

export function defineFormWrapper<Schema extends FormSchema>(formProvideKey: InjectionKey<InjectedFormData<Schema>>, wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>) {
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
                formData?: Partial<TypeOf<Schema>>
                formErrors?: DeepReadonly<inferFormattedError<Schema, string>>
                invalid: boolean
                submit?: InjectedFormData<Schema>['submit']
                validate?: InjectedFormData<Schema>['validate']
                validateWrapper?: () => Promise<boolean>
                fieldsErrors: Map<string, inferFormattedError<Schema, string>>
                clear?: InjectedFormData<Schema>['clear']
                reset?: InjectedFormData<Schema>['reset']
            }
        }>,
        setup(props, { emit }) {
            const injectedFormData = inject(formProvideKey)
            const wrapperProvided = inject(wrapperProvideKey, undefined)
            const fields = ref(new Set<string>())
            const fieldsErrors: Ref<
                Map<string, z.inferFormattedError<Schema>>
            > = ref(new Map())
            const { name } = toRefs(props)

            // provide data to child fields
            provide(wrapperProvideKey, {
                name: readonly(name),
                errors: fieldsErrors,
                fields,
            })

            // add fields to parent wrapper
            watch(
                fields,
                (newValue) => {
                    if (wrapperProvided?.fields) {
                        newValue.forEach((field) => {
                            wrapperProvided?.fields.value.add(field)
                        })
                    }
                },
                { deep: true },
            )

            // add fields to parent wrapper
            watch(
                () => new Map(fieldsErrors.value),
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

            const validateWrapper = () => {
                return injectedFormData?.validate(undefined, fields.value) ?? Promise.resolve(true)
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
