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
	unref,
} from 'vue'
import type { z } from 'zod'
import { FormFieldType } from './enums'
import type {
	InjectedFormData,
	InjectedFormWrapperData,
	InjectedFormFieldData,
	FormFieldComponentOptions,
	Path,
	FormSchema,
} from './types'

export const defineFormField = <Schema extends FormSchema>(
	formProvideKey: InjectionKey<InjectedFormData<Schema>>,
	wrapperProvideKey: InjectionKey<InjectedFormWrapperData<Schema>>,
	formFieldInjectionKey: InjectionKey<InjectedFormFieldData<Schema>>,
	options?: FormFieldComponentOptions,
) => {
	// define component
	return defineComponent({
		name: 'VvFormField',
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
				type: [String, Number, Boolean, Symbol] as PropType<
					Path<z.infer<Schema>>
				>,
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
			lazyLoad: {
				type: Boolean,
				default: false,
			},
			readonly: {
				type: Boolean,
				default: undefined,
			},
		},
		emits: ['invalid', 'valid', 'update:formData', 'update:modelValue'],
		expose: ['invalid', 'invalidLabel', 'errors'],
		setup(props, { slots, emit }) {
			// v-model
			const modelValue = computed({
				get() {
					if (!injectedFormData?.formData) return
					return get(
						Object(injectedFormData.formData.value),
						String(props.name),
					)
				},
				set(value) {
					if (!injectedFormData?.formData) return
					set(
						Object(injectedFormData.formData.value),
						String(props.name),
						value,
					)
					emit('update:modelValue', {
						newValue: modelValue.value,
						formData: injectedFormData?.formData,
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
							} as z.inferFormattedError<Schema>,
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
				() => injectedFormData?.formData,
				() => {
					emit('update:formData', injectedFormData?.formData)
				},
				{ deep: true },
			)
			const onUpdate = (value: unknown) => {
				modelValue.value = value
			}
			const hasFieldProps = computed(() => {
				let toReturn = fieldProps.value
				if (typeof toReturn === 'function') {
					toReturn = toReturn(injectedFormData?.formData)
				}
				return Object.keys(toReturn).reduce<Record<string, unknown>>(
					(acc, key) => {
						acc[key] = unref(toReturn[key])
						return acc
					},
					{},
				)
			})
			const isReadonly = computed(() => {
				const fieldReadonly =
					hasFieldProps.value.readonly ?? props.readonly
				if (fieldReadonly === undefined) {
					return injectedFormData?.readonly.value
				}
				return fieldReadonly
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
				readonly: isReadonly.value,
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
									submit: injectedFormData?.submit,
									validate: injectedFormData?.validate,
									invalid: invalid.value,
									invalidLabel: invalidLabel.value,
									formData: injectedFormData?.formData.value,
									formErrors: injectedFormData?.errors.value,
									errors: errors.value,
									readonly: isReadonly.value,
								}) ?? slots.defalut
							)
						},
					}
				}
				if (!(options?.lazyLoad ?? props.lazyLoad)) {
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
					if (options?.sideEffects) {
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
						case FormFieldType.select:
							return import(
								'@volverjs/ui-vue/vv-select'
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
