import {
	type InjectionKey,
	withModifiers,
	defineComponent,
	ref,
	provide,
	readonly,
	watch,
	h,
	toRaw,
	isProxy,
} from 'vue'
import { watchThrottled } from '@vueuse/core'

import {
	type z,
	type ZodFormattedError,
	type AnyZodObject,
	type ZodEffects,
} from 'zod'
import type { InjectedFormData } from './types'
import { defaultObjectBySchema } from './utils'

export enum FormStatus {
	invalid = 'invalid',
	valid = 'valid',
}

export const defineForm = <
	Schema extends
		| AnyZodObject
		| ZodEffects<AnyZodObject>
		| ZodEffects<ZodEffects<AnyZodObject>>,
>(
	schema: Schema,
	provideKey: InjectionKey<InjectedFormData<Schema>>,
	options?: {
		updateThrottle?: number
		continuosValidation?: boolean
	},
) => {
	const errors = ref<ZodFormattedError<z.infer<Schema>>>()
	const status = ref<FormStatus | undefined>()
	const localModelValue = ref<Partial<z.infer<Schema> | undefined>>()

	return {
		errors,
		status,
		formData: localModelValue,
		component: defineComponent({
			name: 'FormComponent',
			props: {
				modelValue: {
					type: Object,
					default: () => ({}),
				},
				continuosValidation: {
					type: Boolean,
					default: false,
				},
			},
			emits: ['invalid', 'valid', 'submit', 'update:modelValue'],
			expose: ['submit', 'errors', 'status'],
			setup(props, { emit }) {
				localModelValue.value = defaultObjectBySchema(
					schema,
					props.modelValue,
				)

				const keepValidation =
					options?.continuosValidation || props.continuosValidation

				watch(
					() => props.modelValue,
					(newValue) => {
						if (newValue) {
							const original = isProxy(newValue)
								? toRaw(newValue)
								: newValue
							localModelValue.value =
								typeof original?.clone === 'function'
									? original.clone()
									: JSON.parse(JSON.stringify(original))
						}
					},
					{ deep: true },
				)
				// v-model
				watchThrottled(
					localModelValue,
					(newValue) => {
						if (errors.value || keepValidation) {
							parseModelValue()
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
					{ deep: true, throttle: options?.updateThrottle ?? 500 },
				)

				const parseModelValue = (value = localModelValue.value) => {
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
					localModelValue.value = parseResult.data
					emit('update:modelValue', localModelValue.value)
					emit('valid', parseResult.data)
					return true
				}

				// submit
				const submit = () => {
					if (!parseModelValue()) {
						return false
					}
					emit('submit', localModelValue.value)
					return true
				}

				// provide
				provide(provideKey, {
					modelValue: localModelValue,
					submit,
					errors: readonly(errors),
				})

				return { submit }
			},
			render() {
				return h(
					'form',
					{
						onSubmit: withModifiers(this.submit, ['prevent']),
					},
					this.$slots,
				)
			},
		}),
	}
}
