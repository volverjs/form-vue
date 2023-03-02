import { get, set } from 'ts-dot-prop'
import {
	type Component,
	type InjectionKey,
	type PropType,
	type Ref,
	computed,
	defineAsyncComponent,
	h,
	inject,
	onMounted,
	provide,
	readonly,
	resolveComponent,
	toRefs,
	watch,
	defineComponent,
	getCurrentInstance,
} from 'vue'
import { FormFieldType } from './enums'
import type {
	InjectedFormData,
	InjectedFormWrapperData,
	InjectedFormFieldData,
	FormComposableOptions,
} from './types'

export const defineFormField = (
	formProvideKey: InjectionKey<InjectedFormData>,
	wrapperProvideKey: InjectionKey<InjectedFormWrapperData>,
	formFieldInjectionKey: InjectionKey<InjectedFormFieldData>,
	options: FormComposableOptions = {},
): Component => {
	// get options from global properties
	const root = getCurrentInstance()
	options.lazyLoad =
		options.lazyLoad ??
		root?.appContext.config.globalProperties.$vvForm?.lazyLoad
	options.sideEffects =
		options.sideEffects ??
		root?.appContext.config.globalProperties.$vvForm?.sideEffects

	// define component
	return defineComponent({
		name: 'FieldComponent',
		props: {
			type: {
				type: String as PropType<`${FormFieldType}`>,
				validator: (value: FormFieldType) => {
					return Object.values(FormFieldType).includes(value)
				},
				default: FormFieldType.custom,
			},
			is: {
				type: [Object, String] as PropType<Component>,
				default: undefined,
			},
			name: {
				type: [String, Number, Boolean, Symbol],
				required: true,
			},
			props: {
				type: [Object, Function] as PropType<
					| Record<string, unknown>
					| ((
							formData?: Ref<ObjectConstructor>,
					  ) => Record<string, unknown>)
				>,
				default: () => ({}),
			},
			showValid: {
				type: Boolean,
				default: false,
			},
			defaultValue: {
				type: [String, Number, Boolean, Array, Object],
				default: undefined,
			},
		},
		emits: ['invalid', 'valid', 'update:formData', 'update:modelValue'],
		expose: ['invalid', 'invalidLabel', 'errors'],
		setup(props, { slots, emit }) {
			// v-model
			const modelValue = computed({
				get() {
					if (!formProvided?.modelValue) return
					return get(
						Object(formProvided.modelValue.value),
						String(props.name),
					)
				},
				set(value) {
					if (!formProvided?.modelValue) return
					set(
						Object(formProvided.modelValue.value),
						String(props.name),
						value,
					)
					emit('update:modelValue', {
						newValue: modelValue.value,
						formData: formProvided?.modelValue,
					})
				},
			})
			onMounted(() => {
				if (
					modelValue.value === undefined &&
					props.defaultValue !== undefined
				) {
					modelValue.value = props.defaultValue
				}
			})

			// inject data from parent form wrapper
			const wrapperProvided = inject(wrapperProvideKey, undefined)
			if (wrapperProvided) {
				wrapperProvided.fields.value.add(props.name as string)
			}

			// inject data from parent form
			const formProvided = inject(formProvideKey)
			const { props: fieldProps, name: fieldName } = toRefs(props)

			const errors = computed(() => {
				if (!formProvided?.errors.value) {
					return undefined
				}
				return get(formProvided.errors.value, String(props.name))
			})
			const invalidLabel = computed(() => {
				return errors.value?._errors
			})
			const invalid = computed(() => {
				return errors.value !== undefined
			})
			watch(invalid, () => {
				if (invalid.value) {
					emit('invalid', invalidLabel.value)
					if (wrapperProvided) {
						wrapperProvided.errors.value.set(props.name as string, {
							_errors: invalidLabel.value,
						})
					}
				} else {
					emit('valid', modelValue.value)
					if (wrapperProvided) {
						wrapperProvided.errors.value.delete(
							props.name as string,
						)
					}
				}
			})
			watch(
				() => formProvided?.modelValue,
				() => {
					emit('update:formData', formProvided?.modelValue)
				},
				{ deep: true },
			)
			const onUpdate = (value: unknown) => {
				modelValue.value = value
			}
			const hasFieldProps = computed(() => {
				if (typeof fieldProps.value === 'function') {
					return fieldProps.value(formProvided?.modelValue)
				}
				return fieldProps.value
			})
			const hasProps = computed(() => ({
				...hasFieldProps.value,
				name: hasFieldProps.value.name ?? props.name,
				invalid: invalid.value,
				valid: props.showValid
					? Boolean(!invalid.value && modelValue.value)
					: undefined,
				type: ((type: FormFieldType) => {
					if (
						[
							FormFieldType.text,
							FormFieldType.number,
							FormFieldType.email,
							FormFieldType.password,
							FormFieldType.tel,
							FormFieldType.url,
							FormFieldType.search,
							FormFieldType.date,
							FormFieldType.time,
							FormFieldType.datetimeLocal,
							FormFieldType.month,
							FormFieldType.week,
							FormFieldType.color,
						].includes(type)
					) {
						return type
					}
					return undefined
				})(props.type as FormFieldType),
				invalidLabel: invalidLabel.value,
				modelValue: modelValue.value,
				errors: props.is ? errors.value : undefined,
				'onUpdate:modelValue': onUpdate,
			}))

			provide(formFieldInjectionKey, {
				name: readonly(fieldName as Ref<string>),
				errors: readonly(errors),
			})

			const component = computed(() => {
				if (props.type === FormFieldType.custom) {
					return {
						render() {
							return (
								slots.default?.({
									modelValue: modelValue.value,
									onUpdate,
									invalid: invalid.value,
									invalidLabel: invalidLabel.value,
									formData: formProvided?.modelValue.value,
									formErrors: formProvided?.errors.value,
									errors: errors.value,
								}) ?? slots.defalut
							)
						},
					}
				}
				if (!options.lazyLoad) {
					switch (props.type) {
						case FormFieldType.select:
							return resolveComponent('VvSelect')
						case FormFieldType.checkbox:
							return resolveComponent('VvCheckbox')
						case FormFieldType.radio:
							return resolveComponent('VvRadio')
						case FormFieldType.textarea:
							return resolveComponent('VvTextarea')
						case FormFieldType.radioGroup:
							return resolveComponent('VvRadioGroup')
						case FormFieldType.checkboxGroup:
							return resolveComponent('VvCheckboxGroup')
						case FormFieldType.combobox:
							return resolveComponent('VvCombobox')
						default:
							return resolveComponent('VvInputText')
					}
				}
				return defineAsyncComponent(async () => {
					if (options.sideEffects) {
						await Promise.resolve(options.sideEffects(props.type))
					}
					switch (props.type) {
						case FormFieldType.textarea:
							return import(
								'@volverjs/ui-vue/vv-textarea'
							) as Component
						case FormFieldType.radio:
							return import(
								'@volverjs/ui-vue/vv-radio'
							) as Component
						case FormFieldType.radioGroup:
							return import(
								'@volverjs/ui-vue/vv-radio-group'
							) as Component
						case FormFieldType.checkbox:
							return import(
								'@volverjs/ui-vue/vv-checkbox'
							) as Component
						case FormFieldType.checkboxGroup:
							return import(
								'@volverjs/ui-vue/vv-checkbox-group'
							) as Component
						case FormFieldType.combobox:
							return import(
								'@volverjs/ui-vue/vv-combobox'
							) as Component
					}
					return import('@volverjs/ui-vue/vv-input-text') as Component
				})
			})

			return { component, hasProps, invalid }
		},
		render() {
			if (this.is) {
				return h(this.is, this.hasProps, this.$slots)
			}
			if (this.type === FormFieldType.custom) {
				return h(this.component as Component, null, this.$slots)
			}
			return h(this.component as Component, this.hasProps, this.$slots)
		},
	})
}
