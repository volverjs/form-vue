import { get, set } from 'ts-dot-prop'
import {
	type Component,
	type InjectionKey,
	type PropType,
	type Ref,
	type ConcreteComponent,
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
	onBeforeUnmount,
} from 'vue'
import type { AnyZodObject, ZodEffects, z } from 'zod'
import { FormFieldType } from './enums'
import type {
	InjectedFormData,
	InjectedFormWrapperData,
	InjectedFormFieldData,
	FormComposableOptions,
} from './types'

export const defineFormField = <
	Schema extends
		| AnyZodObject
		| ZodEffects<AnyZodObject>
		| ZodEffects<ZodEffects<AnyZodObject>>,
>(
	formProvideKey: InjectionKey<InjectedFormData<Schema>>,
	wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>,
	formFieldInjectionKey: InjectionKey<InjectedFormFieldData<Schema>>,
	options: FormComposableOptions = {},
) => {
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
					Partial<
						| z.infer<Schema>
						| undefined
						| ((
								formData?: Ref<ObjectConstructor>,
						  ) => Partial<z.infer<Schema>> | undefined)
					>
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
					if (!injectedFormData?.modelValue) return
					return get(
						Object(injectedFormData.modelValue.value),
						String(props.name),
					)
				},
				set(value) {
					if (!injectedFormData?.modelValue) return
					set(
						Object(injectedFormData.modelValue.value),
						String(props.name),
						value,
					)
					emit('update:modelValue', {
						newValue: modelValue.value,
						formData: injectedFormData?.modelValue,
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

			onBeforeUnmount(() => {
				unwatchInvalid()
				unwatchInjectedFormData()
			})

			// inject data from parent form wrapper
			const injectedWrapperData = inject(wrapperProvideKey, undefined)
			if (injectedWrapperData) {
				injectedWrapperData.fields.value.add(props.name as string)
			}

			// inject data from parent form
			const injectedFormData = inject(formProvideKey)
			const { props: fieldProps, name: fieldName } = toRefs(props)

			const errors = computed(() => {
				if (!injectedFormData?.errors.value) {
					return undefined
				}
				return get(injectedFormData.errors.value, String(props.name))
			})
			const invalidLabel = computed(() => {
				return errors.value?._errors
			})
			const invalid = computed(() => {
				return errors.value !== undefined
			})
			const unwatchInvalid = watch(invalid, () => {
				if (invalid.value) {
					emit('invalid', invalidLabel.value)
					if (injectedWrapperData) {
						injectedWrapperData.errors.value.set(
							props.name as string,
							{
								_errors: invalidLabel.value,
							},
						)
					}
				} else {
					emit('valid', modelValue.value)
					if (injectedWrapperData) {
						injectedWrapperData.errors.value.delete(
							props.name as string,
						)
					}
				}
			})
			const unwatchInjectedFormData = watch(
				() => injectedFormData?.modelValue,
				() => {
					emit('update:formData', injectedFormData?.modelValue)
				},
				{ deep: true },
			)
			const onUpdate = (value: unknown) => {
				modelValue.value = value
			}
			const hasFieldProps = computed(() => {
				if (typeof fieldProps.value === 'function') {
					return fieldProps.value(injectedFormData?.modelValue)
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
									formData:
										injectedFormData?.modelValue.value,
									formErrors: injectedFormData?.errors.value,
									errors: errors.value,
								}) ?? slots.defalut
							)
						},
					}
				}
				if (!options.lazyLoad) {
					let component: string | ConcreteComponent
					switch (props.type) {
						case FormFieldType.select:
							component = resolveComponent('VvSelect')
							break
						case FormFieldType.checkbox:
							component = resolveComponent('VvCheckbox')
							break
						case FormFieldType.radio:
							component = resolveComponent('VvRadio')
							break
						case FormFieldType.textarea:
							component = resolveComponent('VvTextarea')
							break
						case FormFieldType.radioGroup:
							component = resolveComponent('VvRadioGroup')
							break
						case FormFieldType.checkboxGroup:
							component = resolveComponent('VvCheckboxGroup')
							break
						case FormFieldType.combobox:
							component = resolveComponent('VvCombobox')
							break
						default:
							component = resolveComponent('VvInputText')
					}
					if (typeof component !== 'string') {
						return component
					} else {
						console.warn(
							`[form-vue warn]: ${component} not found, the component will be loaded asynchronously. To avoid this warning, please set "lazyLoad" option.`,
						)
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
