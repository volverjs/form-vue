import {
	type PropType,
	type Ref,
	type InjectionKey,
	withModifiers,
	defineComponent,
	ref,
	provide,
	readonly,
	computed,
	watch,
	h,
	type DefineComponent,
} from 'vue'
import type { ZodSchema } from 'zod'
import type { InjectedFormData } from './types'

export enum FormStatus {
	invalid = 'invalid',
	valid = 'valid',
}

export const buildFormComponent = <FormDataType>(
	schema: ZodSchema<FormDataType>,
	provideKey: InjectionKey<InjectedFormData<FormDataType>>,
): DefineComponent<
	{
		modelValue: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: any
			default: () => undefined
		}
	},
	{
		submit: () => boolean
	}
> => {
	return defineComponent({
		name: 'FormComponent',
		props: {
			modelValue: {
				type: Object as PropType<Partial<FormDataType>>,
				default: () => undefined,
			},
		},
		emits: ['invalid', 'valid', 'submit', 'update:modelValue'],
		expose: ['submit', 'errors', 'status'],
		setup(props, { emit }) {
			// v-model
			const localModelValue = computed({
				get() {
					return props.modelValue
				},
				set(value) {
					emit('update:modelValue', value)
				},
			}) as Ref<Partial<FormDataType>>

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
			watch(
				localModelValue,
				() => {
					if (errors.value) {
						parseModelValue()
					}
				},
				{ deep: true },
			)

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

			return { submit, localModelValue, errors, status }
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
