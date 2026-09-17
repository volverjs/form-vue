import type { Component, InjectionKey, PropType, SlotsType, UnwrapRef } from 'vue'
import type {
    FormComponentOptions,
    FormSchema,
    FormTemplate,
    InjectedFormData,
    InjectedFormWrapperData,
    Path,
    InferSchema,
    InferFormattedError,
    SuperRefine,
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
import { FormStatus } from './enums'
import { safeParseAsync, defaultObjectBySchema, formatError, formatIssues, withSuperRefine } from './utils'

export function defineForm<Schema extends FormSchema, Type, FormTemplateComponent extends Component>(schema: Schema, provideKey: InjectionKey<InjectedFormData<Schema, Type>>, options: FormComponentOptions<Schema, Type>, VvFormTemplate: FormTemplateComponent, wrappers: Map<string, InjectedFormWrapperData<Schema>>) {
    const errors = ref<InferFormattedError<Schema> | undefined>()
    const status = ref<FormStatus | undefined>()
    const invalid = computed(() => status.value === FormStatus.invalid)
    const formData = ref<undefined extends Type ? Partial<InferSchema<Schema>> : Type>()
    const readonly = ref<boolean>(false)
    let validateFields: Set<Path<InferSchema<Schema>>> | undefined

    const formDataAdapter = (data?: InferSchema<Schema>): undefined extends Type ? Partial<InferSchema<Schema>> : Type => {
        const toReturn = defaultObjectBySchema(schema, data)
        if (options?.class) {
            const ClassObject = options.class
            // @ts-expect-error - this is a class
            return new ClassObject(toReturn)
        }
        // @ts-expect-error - this is a plain object
        return toReturn
    }

    const refinedSchemas = new WeakMap<SuperRefine<Schema>, FormSchema>()

    /**
     * The schema to parse against: the plain one, or a copy carrying the ad-hoc
     * refinement.
     *
     * Results are cached per refinement function because attaching one builds a new
     * schema, which throws away the parser Zod compiled for it (about 8x per parse).
     * Continuous validation would otherwise pay that on every throttled update, so a
     * refinement passed as a prop should be a stable function rather than an inline
     * arrow, which is a new identity on every render.
     */
    const schemaFor = (superRefine?: SuperRefine<Schema>) => {
        if (!superRefine) {
            return schema
        }
        let refined = refinedSchemas.get(superRefine)
        if (!refined) {
            refined = withSuperRefine(schema, superRefine)
            refinedSchemas.set(superRefine, refined)
        }
        return refined
    }

    const validate = async (value = formData.value, options?: {
        fields?: Set<Path<InferSchema<Schema>>>
        superRefine?: SuperRefine<Schema>
    }) => {
        validateFields = options?.fields
        if (readonly.value) {
            return true
        }
        const parseResult = await safeParseAsync(schemaFor(options?.superRefine), value)
        if (!parseResult.success) {
            if (!validateFields?.size) {
                status.value = FormStatus.invalid
                errors.value = formatError(schema, parseResult.error) as InferFormattedError<Schema>
                return false
            }
            const fieldsIssues = parseResult.error.issues.filter(item =>
                validateFields?.has(item.path.join('.') as Path<InferSchema<Schema>>),
            )
            if (!fieldsIssues.length) {
                // The schema as a whole is invalid, but none of the requested fields is:
                // report success without claiming `valid`, which would emit `valid` and
                // `update:modelValue` for data that was never re-parsed.
                errors.value = undefined
                status.value = FormStatus.unknown
                return true
            }
            status.value = FormStatus.invalid
            errors.value = formatIssues(schema, parseResult.error, fieldsIssues) as InferFormattedError<Schema>
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

    const reset = () => {
        // Reset the form data without re-triggering the throttled formData watcher.
        // That watcher fires on a leading edge and would set `status = updated`,
        // overwriting `status = reset` before the status watcher can emit the
        // `reset` event — a timing-sensitive race when reset happens outside the
        // throttle window.
        ignoreUpdates(() => {
            formData.value = formDataAdapter()
        })
        clear()
        status.value = FormStatus.reset
    }

    const submit = async (options?: {
        fields?: Set<Path<InferSchema<Schema>>>
        superRefine?: SuperRefine<Schema>
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
                default: options?.readonly,
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
                type: Function as PropType<SuperRefine<Schema>>,
                default: undefined,
            },
            validateFields: {
                type: Array as PropType<Path<InferSchema<Schema>>[]>,
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
            formData.value = formDataAdapter(toRaw(props.modelValue) as InferSchema<Schema> | undefined)

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

                        formData.value = formDataAdapter(original as InferSchema<Schema>)
                    }
                },
                { deep: true },
            )

            watch(status, async (newValue) => {
                if (newValue === FormStatus.invalid) {
                    const toReturn = toRaw(errors.value)
                    emit('invalid', toReturn)
                    options?.onInvalid?.(
                        toReturn,
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
                if (props.readonly !== undefined) {
                    readonly.value = props.readonly
                }
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

            /**
             * `validate()` with the form's own props applied.
             *
             * The `superRefine` and `validateFields` props describe this form, so they
             * have to reach every entry point that validates it, not only the native
             * submit and the continuous validation watcher. An explicit argument still
             * wins over the prop.
             */
            const validateWithProps: typeof validate = (value, validateOptions) =>
                validate(value, {
                    fields: validateOptions?.fields,
                    superRefine: validateOptions?.superRefine ?? props.superRefine,
                })

            /**
             * `submit()` with the form's own props applied, handed to consumers through
             * `provide()`, the component instance and the default slot alike.
             *
             * It takes no argument on purpose: `InjectedFormData['submit']` declares
             * none, and this doubles as the native submit handler, which would otherwise
             * pass the DOM event in as the options object.
             */
            const submitWithProps = () =>
                submit({
                    superRefine: props.superRefine,
                    fields: new Set(props.validateFields),
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
                submit: submitWithProps,
                validate: validateWithProps,
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
                submit: submitWithProps,
                validate: validateWithProps,
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
                    // `this.*` rather than the closure, so the slot gets the same
                    // prop-aware functions as the rest of the component.
                    submit: this.submit,
                    validate: this.validate,
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
