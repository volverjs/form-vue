import {
	type Component,
	type InjectionKey,
	type DeepReadonly,
	type Ref,
	type PropType,
	type WatchStopHandle,
	withModifiers,
	defineComponent,
	ref,
	provide,
	readonly,
	watch,
	h,
	toRaw,
	isProxy,
	computed,
} from 'vue'
import {
	watchIgnorable,
	throttleFilter,
	type IgnoredUpdater,
} from '@vueuse/core'
import { type z, type ZodFormattedError, type TypeOf } from 'zod'
import type {
	FormComponentOptions,
	FormSchema,
	FormTemplate,
	InjectedFormData,
} from './types'
import { FormStatus } from './enums'
import { defaultObjectBySchema } from './utils'

export const defineForm = <Schema extends FormSchema>(
	schema: Schema,
	provideKey: InjectionKey<InjectedFormData<Schema>>,
	options?: FormComponentOptions<Schema>,
	VvFormTemplate?: Component,
) => {
	const errors = ref<z.inferFormattedError<Schema> | undefined>()
	const status = ref<FormStatus | undefined>()
	const invalid = computed(() => status.value === FormStatus.invalid)
	const formData = ref<Partial<z.infer<Schema> | undefined>>()

	const validate = async (value = formData.value) => {
		const parseResult = await schema.safeParseAsync(value)
		if (!parseResult.success) {
			errors.value = parseResult.error.format() as ZodFormattedError<
				z.infer<Schema>
			>
			status.value = FormStatus.invalid
			return false
		}
		errors.value = undefined
		status.value = FormStatus.valid
		formData.value = parseResult.data
		return true
	}

	const submit = async () => {
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

	const component = defineComponent({
		name: 'VvForm',
		props: {
			continuosValidation: {
				type: Boolean,
				default: false,
			},
			modelValue: {
				type: Object,
				default: () => ({}),
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
		emits: ['invalid', 'valid', 'submit', 'update:modelValue'],
		expose: ['submit', 'validate', 'errors', 'status', 'valid', 'invalid'],
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
							JSON.stringify(original) ===
							JSON.stringify(toRaw(formData.value))
						) {
							return
						}

						formData.value =
							typeof original?.clone === 'function'
								? original.clone()
								: JSON.parse(JSON.stringify(original))
					}
				},
				{ deep: true },
			)

			watch(status, async (newValue) => {
				if (newValue === FormStatus.invalid) {
					const toReturn = toRaw(
						errors.value as ZodFormattedError<z.infer<Schema>>,
					)
					emit('invalid', toReturn)
					options?.onInvalid?.(toReturn)
					return
				}
				if (newValue === FormStatus.valid) {
					const toReturn = toRaw(formData.value as z.infer<Schema>)
					emit('valid', toReturn)
					options?.onValid?.(toReturn)
					emit('update:modelValue', toReturn)
					options?.onUpdate?.(toReturn)
					return
				}
				if (newValue === FormStatus.submitting) {
					const toReturn = toRaw(formData.value as z.infer<Schema>)
					emit('submit', toReturn)
					options?.onSubmit?.(toReturn)
				}
				if (newValue === FormStatus.updated) {
					if (
						errors.value ||
						options?.continuosValidation ||
						props.continuosValidation
					) {
						await validate()
					}
					if (
						!formData.value ||
						!props.modelValue ||
						JSON.stringify(formData.value) !==
							JSON.stringify(props.modelValue)
					) {
						const toReturn = toRaw(
							formData.value as z.infer<Schema>,
						)
						emit('update:modelValue', toReturn)
						options?.onUpdate?.(toReturn)
					}
					if (status.value === FormStatus.updated) {
						status.value = FormStatus.unknown
					}
				}
			})

			provide(provideKey, {
				formData,
				submit,
				validate,
				ignoreUpdates,
				stopUpdatesWatch,
				errors: readonly(errors),
				status: readonly(status),
				invalid,
			})

			return {
				formData,
				submit,
				validate,
				ignoreUpdates,
				stopUpdatesWatch,
				errors: readonly(errors),
				status: readonly(status),
				invalid,
			}
		},
		render() {
			const defaultSlot = () =>
				this.$slots?.default?.({
					formData: this.formData,
					submit: this.submit,
					validate: this.validate,
					ignoreUpdates: this.ignoreUpdates,
					stopUpdatesWatch: this.stopUpdatesWatch,
					errors: this.errors,
					status: this.status,
					invalid: this.invalid,
				}) ?? this.$slots.default
			return h(
				this.tag,
				{
					onSubmit: withModifiers(this.submit, ['prevent']),
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
		errors,
		status,
		invalid,
		formData,
		validate,
		submit,
		ignoreUpdates,
		stopUpdatesWatch,
		/**
		 * An hack to add types to the default slot
		 */
		VvForm: component as typeof component & {
			new (): {
				$slots: {
					default: (_: {
						formData: unknown extends
							| Partial<TypeOf<Schema>>
							| undefined
							? undefined
							: Partial<TypeOf<Schema>> | undefined
						submit: () => Promise<boolean>
						validate: () => Promise<boolean>
						ignoreUpdates: IgnoredUpdater
						stopUpdatesWatch: WatchStopHandle
						errors: Readonly<
							Ref<DeepReadonly<z.inferFormattedError<Schema>>>
						>
						status: Ref<DeepReadonly<`${FormStatus}` | undefined>>
						invalid: Ref<DeepReadonly<boolean>>
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					}) => any
				}
			}
		},
	}
}
