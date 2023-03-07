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
			// Flag to update and emit modelValue
			const isEmitDisabled = ref(false)

			// watch prop modelValue to update localModelValue
			watch(
				() => props.modelValue,
				(newValue) => {
					if (newValue) {
						// remove proxy if exist
						const original = isProxy(newValue)
							? toRaw(newValue)
							: newValue

						// update localModelValue and set isEmitDisabled to "true" to avoid other emit watching props.modelValue
						isEmitDisabled.value = true
						localModelValue.value =
							typeof original?.clone === 'function'
								? original.clone()
								: JSON.parse(JSON.stringify(original))
					}
				},
				{ deep: true },
			)

			// watch localModelValue to emit "update:modelValue"
			watchThrottled(
				localModelValue,
				(newValue) => {
					// check errors
					if (errors.value) {
						parseModelValue(
							localModelValue.value,
							isEmitDisabled.value,
						)
					}
					// emit 'update:modelValue' only if props.modelValue not triggered
					if (isEmitDisabled.value) {
						isEmitDisabled.value = false
						return
					}
					emit('update:modelValue', newValue)
				},
				{ deep: true, throttle: options?.updateThrottle ?? 500 },
			)

			// validation
			const errors = ref()
			const status = ref()
			const parseModelValue = (
				value = localModelValue.value,
				emitParseResult = true,
			) => {
				const parseResult = schema.safeParse(value)
				if (!parseResult.success) {
					errors.value = parseResult.error.format()
					status.value = FormStatus.invalid
					emit('invalid', errors.value)
					return false
				}
				errors.value = undefined
				status.value = FormStatus.valid
				if (emitParseResult) {
					localModelValue.value = parseResult.data
				}
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
