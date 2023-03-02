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

import type { AnyZodObject } from 'zod'
import type { InjectedFormData } from './types'
import { defaultObjectBySchema } from './utils'

export enum FormStatus {
	invalid = 'invalid',
	valid = 'valid',
}

export const defineForm = (
	schema: AnyZodObject,
	provideKey: InjectionKey<InjectedFormData>,
	options?: {
		updateThrottle?: number
	},
) => {
	return defineComponent({
		name: 'FormComponent',
		props: {
			modelValue: {
				type: Object,
				default: () => ({}),
			},
		},
		emits: ['invalid', 'valid', 'submit', 'update:modelValue'],
		expose: ['submit', 'errors', 'status'],
		setup(props, { emit }) {
			const localModelValue = ref(
				defaultObjectBySchema(schema, props.modelValue),
			)
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
								: structuredClone(original)
					}
				},
				{ deep: true },
			)
			// v-model
			watchThrottled(
				localModelValue,
				(newValue) => {
					if (errors.value) {
						parseModelValue()
					}
					emit('update:modelValue', newValue)
				},
				{ deep: true, throttle: options?.updateThrottle ?? 500 },
			)

			// validation
			const errors = ref()
			const status = ref()
			const parseModelValue = (value = localModelValue.value) => {
				const parseResult = schema.safeParse(value)
				if (!parseResult.success) {
					errors.value = parseResult.error.format()
					status.value = FormStatus.invalid
					emit('invalid', errors.value)
					return false
				}
				errors.value = undefined
				status.value = FormStatus.valid
				localModelValue.value = parseResult.data
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
	})
}
