import {
	type InjectionKey,
	type Ref,
	computed,
	defineComponent,
	inject,
	provide,
	readonly,
	ref,
	toRefs,
	watch,
	h,
	type DeepReadonly,
} from 'vue'
import type { TypeOf, z } from 'zod'
import type {
	FormSchema,
	InjectedFormData,
	InjectedFormWrapperData,
} from './types'

export const defineFormWrapper = <Schema extends FormSchema>(
	formProvideKey: InjectionKey<InjectedFormData<Schema>>,
	wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>,
) => {
	const VvFormWrapper = defineComponent({
		name: 'WrapperComponent',
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
		expose: ['fields', 'invalid'],
		setup(props, { emit }) {
			const injectedFormData = inject(formProvideKey)
			const wrapperProvided = inject(wrapperProvideKey, undefined)
			const fields = ref(new Set<string>())
			const fieldsErrors: Ref<
				Map<string, Record<string, { _errors: string[] }>>
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
				} else {
					emit('valid')
				}
			})

			return {
				formData: injectedFormData?.formData,
				errors: injectedFormData?.errors,
				invalid,
				fields,
				fieldsErrors,
			}
		},
		render() {
			if (this.tag) {
				return h(this.tag, null, {
					default: () =>
						this.$slots.default?.({
							invalid: this.invalid,
							formData: this.formData,
							errors: this.errors,
							fieldsErrors: this.fieldsErrors,
						}) ?? this.$slots.defalut,
				})
			}
			return (
				this.$slots.default?.({
					invalid: this.invalid,
					formData: this.formData,
					errors: this.errors,
					fieldsErrors: this.fieldsErrors,
				}) ?? this.$slots.defalut
			)
		},
	})
	/**
	 * An hack to add types to the default slot
	 */
	return VvFormWrapper as typeof VvFormWrapper & {
		new (): {
			$slots: {
				default: (_: {
					invalid: boolean
					formData: unknown extends
						| Partial<TypeOf<Schema>>
						| undefined
						? undefined
						: Partial<TypeOf<Schema>> | undefined
					errors: Readonly<
						Ref<DeepReadonly<z.inferFormattedError<Schema>>>
					>
					fieldsErrors: Map<
						string,
						Record<
							string,
							{
								_errors: string[]
							}
						>
					>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				}) => any
			}
		}
	}
}
