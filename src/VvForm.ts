import {
	type InjectionKey,
	type DeepReadonly,
	type Ref,
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
import { watchThrottled } from '@vueuse/core'
import type { z, ZodFormattedError, TypeOf } from 'zod'
import type {
	FormComponentOptions,
	FormSchema,
	InjectedFormData,
} from './types'
import { FormStatus } from './enums'
import { defaultObjectBySchema } from './utils'

export const defineForm = <Schema extends FormSchema>(
	schema: Schema,
	provideKey: InjectionKey<InjectedFormData<Schema>>,
	options?: FormComponentOptions,
) => {
	const errors = ref<ZodFormattedError<z.infer<Schema>>>()
	const status = ref<FormStatus | undefined>()
	const formData = ref<Partial<z.infer<Schema> | undefined>>()
	const component = defineComponent({
		name: 'FormComponent',
		props: {
			modelValue: {
				type: Object,
				default: () => ({}),
			},
			updateThrottle: {
				type: Number,
				default: 500,
			},
			continuosValidation: {
				type: Boolean,
				default: false,
			},
		},
		emits: ['invalid', 'valid', 'submit', 'update:modelValue'],
		expose: ['submit', 'validate', 'errors', 'status', 'valid', 'invalid'],
		setup(props, { emit }) {
			formData.value = defaultObjectBySchema(
				schema,
				toRaw(props.modelValue),
			)

			// clone modelValue and update formData
			watch(
				() => props.modelValue,
				(newValue) => {
					if (newValue) {
						const original = isProxy(newValue)
							? toRaw(newValue)
							: newValue
						formData.value =
							typeof original?.clone === 'function'
								? original.clone()
								: JSON.parse(JSON.stringify(original))
					}
				},
				{ deep: true },
			)

			// emit update:modelValue on formData change
			watchThrottled(
				formData,
				(newValue) => {
					if (
						(errors.value || options?.continuosValidation) ??
						props.continuosValidation
					) {
						validate()
					}
					if (
						!newValue ||
						!props.modelValue ||
						JSON.stringify(newValue) !==
							JSON.stringify(props.modelValue)
					) {
						emit('update:modelValue', newValue)
					}
				},
				{
					deep: true,
					throttle: options?.updateThrottle ?? props.updateThrottle,
				},
			)

			// validate formData with safeParse
			const validate = (value = formData.value) => {
				const parseResult = schema.safeParse(value)
				if (!parseResult.success) {
					errors.value =
						parseResult.error.format() as ZodFormattedError<
							z.infer<Schema>
						>
					status.value = FormStatus.invalid
					emit('invalid', errors.value)
					return false
				}
				errors.value = undefined
				status.value = FormStatus.valid
				formData.value = parseResult.data
				emit('update:modelValue', formData.value)
				emit('valid', parseResult.data)
				return true
			}

			// emit submit event if form is valid
			const submit = () => {
				if (!validate()) {
					return false
				}
				emit('submit', formData.value)
				return true
			}

			const invalid = computed(() => status.value === FormStatus.invalid)

			// provide data to children
			provide(provideKey, {
				formData,
				submit,
				validate,
				errors: readonly(errors),
				status: readonly(status),
				invalid,
			})

			return {
				formData,
				submit,
				validate,
				errors: readonly(errors),
				status: readonly(status),
				invalid,
			}
		},
		render() {
			return h(
				'form',
				{
					onSubmit: withModifiers(this.submit, ['prevent']),
				},
				{
					default: () =>
						this.$slots?.default?.({
							formData: this.formData,
							submit: this.submit,
							validate: this.validate,
							errors: this.errors,
							status: this.status,
							invalid: this.invalid,
						}) ?? this.$slots.default,
				},
			)
		},
	})
	return {
		errors,
		status,
		formData,
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
						submit: () => boolean
						validate: () => boolean
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
