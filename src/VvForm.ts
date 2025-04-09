import type { Component, InjectionKey, PropType, SlotsType, UnwrapRef } from 'vue'
import type { RefinementCtx, z } from 'zod'
import type {
    FormComponentOptions,
    FormSchema,
    FormTemplate,
    InjectedFormData,
    InjectedFormWrapperData,
    Path,
} from './types'
import {
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
import { ZodError } from 'zod'
import { FormStatus } from './enums'
import { defaultObjectBySchema } from './utils'

export function defineForm<Schema extends FormSchema, Type, FormTemplateComponent extends Component>(schema: Schema, provideKey: InjectionKey<InjectedFormData<Schema, Type>>, options: FormComponentOptions<Schema, Type>, VvFormTemplate: FormTemplateComponent, wrappers: Map<string, InjectedFormWrapperData<Schema>>) {
    const errors = ref<z.inferFormattedError<Schema> | undefined>()
    const status = ref<FormStatus | undefined>()
    const invalid = computed(() => status.value === FormStatus.invalid)
    const formData = ref<undefined extends Type ? Partial<z.infer<Schema>> : Type>()
    const readonly = ref<boolean>(false)
    let validateFields: Set<Path<z.infer<Schema>>> | undefined

    const formDataAdapter = (data?: z.infer<Schema>): undefined extends Type ? Partial<z.infer<Schema>> : Type => {
        const toReturn = defaultObjectBySchema(schema, data)
        if (options?.class) {
            const ClassObject = options.class
            // @ts-expect-error - this is a class
            return new ClassObject(toReturn)
        }
        // @ts-expect-error - this is a plain object
        return toReturn
    }

    const validate = async (value = formData.value, options?: {
        fields?: Set<Path<z.infer<Schema>>>
        superRefine?: (arg: z.infer<Schema>, ctx: RefinementCtx) => void | Promise<void>
    }) => {
        validateFields = options?.fields
        if (readonly.value) {
            return true
        }
        const parseResult = options?.superRefine
            ? await schema.superRefine(options.superRefine).safeParseAsync(value)
            : await schema.safeParseAsync(value)
        if (!parseResult.success) {
            status.value = FormStatus.invalid
            if (!validateFields?.size) {
                errors.value = parseResult.error.format() as z.inferFormattedError<Schema>
                return false
            }
            const fieldsIssues = parseResult.error.issues.filter(item =>
                validateFields?.has(item.path.join('.') as Path<z.infer<Schema>>),
            )
            if (!fieldsIssues.length) {
                errors.value = undefined
                return true
            }
            errors.value = new ZodError(fieldsIssues).format() as z.inferFormattedError<Schema>
            return false
        }
        errors.value = undefined
        status.value = FormStatus.valid
        formData.value = formDataAdapter(parseResult.data)
        return true
    }

    const clear = () => {
        errors.value = undefined
        status.value = undefined
        validateFields = undefined
    }

    const reset = () => {
        formData.value = formDataAdapter()
        clear()
        status.value = FormStatus.reset
    }

    const submit = async (options?: {
        fields?: Set<Path<z.infer<Schema>>>
        superRefine?: (arg: z.infer<Schema>, ctx: RefinementCtx) => void | Promise<void>
    }) => {
        if (readonly.value) {
            return false
        }
        if (!(await validate(undefined, options))) {
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
                type: [Array, Function] as PropType<FormTemplate<Schema, Type>>,
                default: undefined,
            },
            superRefine: {
                type: Function as PropType<(arg: z.infer<Schema>, ctx: RefinementCtx) => void | Promise<void>>,
                default: undefined,
            },
            validateFields: {
                type: Array as PropType<Path<z.infer<Schema>>[]>,
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
                errors: UnwrapRef<typeof readonlyErrors>
                formData: UnwrapRef<typeof formData>
                invalid: UnwrapRef<typeof invalid>
                readonly: UnwrapRef<typeof readonly>
                status: UnwrapRef<typeof readonlyStatus>
                wrappers: typeof wrappers
                clear: typeof clear
                ignoreUpdates: typeof ignoreUpdates
                reset: typeof reset
                stopUpdatesWatch: typeof stopUpdatesWatch
                submit: typeof submit
                validate: typeof validate
            }
        }>,
        setup(props, { emit }) {
            formData.value = formDataAdapter(toRaw(props.modelValue))

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

                        formData.value = typeof original?.clone === 'function'
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
                        await validate(undefined, {
                            superRefine: props.superRefine,
                            fields: validateFields ?? new Set(props.validateFields),
                        })
                    }
                    if (
                        !formData.value
                        || !props.modelValue
                        || JSON.stringify(formData.value) !== JSON.stringify(props.modelValue)
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
                wrappers,
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
                submit: () => submit({
                    superRefine: props.superRefine,
                    fields: new Set(props.validateFields),
                }),
                validate,
                wrappers,
            }
        },
        render() {
            const defaultSlot = () =>
                this.$slots?.default?.({
                    errors: readonlyErrors.value,
                    formData: formData.value,
                    invalid: invalid.value,
                    readonly: readonly.value,
                    status: readonlyStatus.value,
                    wrappers,
                    clear,
                    ignoreUpdates,
                    reset,
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
        wrappers,
        stopUpdatesWatch,
        submit,
        validate,
        VvForm,
    }
}
