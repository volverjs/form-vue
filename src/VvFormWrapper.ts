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
} from 'vue'
import type { AnyZodObject, ZodEffects } from 'zod'
import type { InjectedFormData, InjectedFormWrapperData } from './types'

export const defineFormWrapper = <
	Schema extends
		| AnyZodObject
		| ZodEffects<AnyZodObject>
		| ZodEffects<ZodEffects<AnyZodObject>>,
>(
	formProvideKey: InjectionKey<InjectedFormData<Schema>>,
	wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>,
) => {
	return defineComponent({
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
			const formProvided = inject(formProvideKey)
			const wrapperProvided = inject(wrapperProvideKey, undefined)
			const fields = ref(new Set<string>())
			const errors: Ref<
				Map<string, Record<string, { _errors: string[] }>>
			> = ref(new Map())
			const { name } = toRefs(props)

			// provide data to child fields
			provide(wrapperProvideKey, {
				name: readonly(name),
				errors,
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
				() => new Map(errors.value),
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
				if (!formProvided?.errors.value) {
					return false
				}
				return errors.value.size > 0
			})

			watch(invalid, () => {
				if (invalid.value) {
					emit('invalid')
				} else {
					emit('valid')
				}
			})

			return { formProvided, invalid, fields, errors }
		},
		render() {
			if (this.tag) {
				return h(
					this.tag,
					null,
					this.$slots.default?.({
						invalid: this.invalid,
						formData: this.formProvided?.modelValue.value,
						errors: this.formProvided?.errors.value,
						fieldsErrors: this.errors,
					}) ?? this.$slots.defalut,
				)
			}
			return (
				this.$slots.default?.({
					invalid: this.invalid,
					formData: this.formProvided?.modelValue.value,
					errors: this.formProvided?.errors.value,
					fieldsErrors: this.errors,
				}) ?? this.$slots.defalut
			)
		},
	})
}
