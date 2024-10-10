import {
    type Component,
    type InjectionKey,
    type PropType,
    type SlotsType,
    computed,
    defineComponent,
    h,
    isProxy,
    onMounted,
    provide,
    readonly as makeReadonly,
    ref,
    toRaw,
    watch,
    withModifiers,
} from 'vue'
import {
    throttleFilter,
    watchIgnorable,
} from '@vueuse/core'
import { type z, ZodError } from 'zod'
import type {
    FormComponentOptions,
    FormSchema,
    FormTemplate,
    InjectedFormData,
} from './types'
import { FormStatus } from './enums'
import { defaultObjectBySchema } from './utils'

export function defineForm<Schema extends FormSchema>(schema: Schema, provideKey: InjectionKey<InjectedFormData<Schema>>, options?: FormComponentOptions<Schema>, VvFormTemplate?: Component) {
    const errors = ref<z.inferFormattedError<Schema> | undefined>()
    const status = ref<FormStatus | undefined>()
    const invalid = computed(() => status.value === FormStatus.invalid)
    const formData = ref<Partial<z.infer<Schema> | undefined>>()
    const readonly = ref<boolean>(false)
    let validationFields: Set<string> | undefined

    const validate = async (value = formData.value, fields?: Set<string>) => {
        validationFields = fields
        if (readonly.value) {
            return true
        }
        const parseResult = await schema.safeParseAsync(value)
        if (!parseResult.success) {
            if (!fields) {
                errors.value
				= parseResult.error.format() as z.inferFormattedError<Schema>
                status.value = FormStatus.invalid
                return false
            }
            const fieldsIssues = parseResult.error.issues.filter(item => fields.has(item.path.join('.')))
            if (!fieldsIssues.length) {
                errors.value = undefined
                status.value = FormStatus.unknown
                formData.value = parseResult.data
                return true
            }
            errors.value = new ZodError(fieldsIssues).format() as z.inferFormattedError<Schema>
            status.value = FormStatus.invalid
            return false
        }
        errors.value = undefined
        status.value = FormStatus.valid
        formData.value = parseResult.data
        return true
    }

    const clear = () => {
        errors.value = undefined
        status.value = undefined
        validationFields = undefined
    }

    const reset = () => {
        formData.value = defaultObjectBySchema(schema)
        clear()
        status.value = FormStatus.reset
    }

    const submit = async () => {
        if (readonly.value) {
            return false
        }
        if (!(await validate())) {
            return false
        }
        status.value = FormStatus.submitting
        return true
    }

    const { ignoreUpdates, stop: stopUpdatesWatch } = watchIgnorable(
        formData,
        () => {
            status.value = FormStatus.updated
        },
        {
            deep: true,
            eventFilter: throttleFilter(options?.updateThrottle ?? 500),
        },
    )

    const readonlyErrors = makeReadonly(errors)
    const readonlyStatus = makeReadonly(status)

    const VvForm = defineComponent({
        name: 'VvForm',
        props: {
            continuousValidation: {
                type: Boolean,
                default: false,
            },
            modelValue: {
                type: Object,
                default: () => ({}),
            },
            readonly: {
                type: Boolean,
                default: options?.readonly ?? false,
            },
            tag: {
                type: String,
                default: 'form',
            },
            template: {
                type: [Array, Function] as PropType<FormTemplate<Schema>>,
                default: undefined,
            },
        },
        emits: [
            'invalid',
            'submit',
            'update:modelValue',
            'update:readonly',
            'valid',
            'reset',
        ],
        expose: [
            'errors',
            'invalid',
            'readonly',
            'status',
            'submit',
            'tag',
            'template',
            'valid',
            'validate',
            'clear',
            'reset',
        ],
        slots: Object as SlotsType<{
            default: {
                errors: typeof readonlyErrors
                formData: typeof formData
                ignoreUpdates: typeof ignoreUpdates
                invalid: typeof invalid
                readonly: typeof readonly
                status: typeof readonlyStatus
                stopUpdatesWatch: typeof stopUpdatesWatch
                submit: typeof submit
                validate: typeof validate
                clear: typeof clear
                reset: typeof reset
            }
        }>,
        setup(props, { emit }) {
            formData.value = defaultObjectBySchema(
                schema,
                toRaw(props.modelValue),
            )

            watch(
                () => props.modelValue,
                (newValue) => {
                    if (newValue) {
                        const original = isProxy(newValue)
                            ? toRaw(newValue)
                            : newValue

                        if (
                            JSON.stringify(original)
                            === JSON.stringify(toRaw(formData.value))
                        ) {
                            return
                        }

                        formData.value
							= typeof original?.clone === 'function'
                                ? original.clone()
                                : JSON.parse(JSON.stringify(original))
                    }
                },
                { deep: true },
            )

            watch(status, async (newValue) => {
                if (newValue === FormStatus.invalid) {
                    const toReturn = toRaw(errors.value)
                    emit('invalid', toReturn)
                    options?.onInvalid?.(
                        toReturn as z.inferFormattedError<Schema> | undefined,
                    )
                    return
                }
                if (newValue === FormStatus.valid) {
                    const toReturn = toRaw(formData.value)
                    emit('valid', toReturn)
                    options?.onValid?.(toReturn)
                    emit('update:modelValue', toReturn)
                    options?.onUpdate?.(toReturn)
                    return
                }
                if (newValue === FormStatus.submitting) {
                    const toReturn = toRaw(formData.value)
                    emit('submit', toReturn)
                    options?.onSubmit?.(toReturn)
                    return
                }
                if (newValue === FormStatus.reset) {
                    const toReturn = toRaw(formData.value)
                    emit('reset', toReturn)
                    options?.onReset?.(toReturn)
                    return
                }
                if (newValue === FormStatus.updated) {
                    if (
                        errors.value
                        || options?.continuousValidation
                        || props.continuousValidation
                    ) {
                        await validate(undefined, validationFields)
                    }
                    if (
                        !formData.value
                        || !props.modelValue
                        || JSON.stringify(formData.value)
                        !== JSON.stringify(props.modelValue)
                    ) {
                        const toReturn = toRaw(formData.value)
                        emit('update:modelValue', toReturn)
                        options?.onUpdate?.(toReturn)
                    }
                    if (status.value === FormStatus.updated) {
                        status.value = FormStatus.unknown
                    }
                }
            })

            // readonly
            onMounted(() => {
                readonly.value = props.readonly
            })
            watch(
                () => props.readonly,
                (newValue) => {
                    readonly.value = newValue
                },
            )
            watch(readonly, (newValue) => {
                if (newValue !== props.readonly) {
                    emit('update:readonly', readonly.value)
                }
            })

            provide(provideKey, {
                clear,
                errors: readonlyErrors,
                formData,
                ignoreUpdates,
                invalid,
                readonly,
                reset,
                status: readonlyStatus,
                stopUpdatesWatch,
                submit,
                validate,
            })

            return {
                clear,
                errors: readonlyErrors,
                formData,
                ignoreUpdates,
                invalid,
                isReadonly: readonly,
                reset,
                status: readonlyStatus,
                stopUpdatesWatch,
                submit,
                validate,
            }
        },
        render() {
            const defaultSlot = () =>
                this.$slots?.default?.({
                    clear,
                    errors: readonlyErrors,
                    formData,
                    ignoreUpdates,
                    invalid,
                    readonly,
                    reset,
                    status: readonlyStatus,
                    stopUpdatesWatch,
                    submit,
                    validate,
                }) ?? this.$slots.default
            return h(
                this.tag,
                {
                    onSubmit: withModifiers(this.submit, ['prevent']),
                    onReset: withModifiers(this.reset, ['prevent']),
                },
                (this.template ?? options?.template) && VvFormTemplate
                    ? [
                            h(
                                VvFormTemplate,
                                {
                                    schema: this.template ?? options?.template,
                                },
                                {
                                    default: defaultSlot,
                                },
                            ),
                        ]
                    : {
                            default: defaultSlot,
                        },
            )
        },
    })
    return {
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
    }
}
