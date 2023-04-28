import {
	type Component,
	type PropType,
	type InjectionKey,
	type DeepReadonly,
	type Ref,
	type VNode,
	defineComponent,
	h,
	inject,
	unref,
} from 'vue'
import type { TypeOf, z } from 'zod'
import type { FormSchema, InjectedFormData, FormTemplateItem } from './types'
import type { FormStatus } from './enums'

export const defineFormTemplate = <Schema extends FormSchema>(
	formProvideKey: InjectionKey<InjectedFormData<Schema>>,
	VvFormField: Component,
) => {
	const VvFormTemplate: Component = defineComponent({
		props: {
			schema: {
				type: [Array, Function] as PropType<
					| FormTemplateItem<Schema>[]
					| ((
							data?: InjectedFormData<Schema>,
					  ) => FormTemplateItem<Schema>[])
				>,
				required: true,
			},
		},
		setup(templateProps, { slots: templateSlots }) {
			const injectedFormData = inject(formProvideKey)
			const normalizedSchema =
				typeof templateProps.schema === 'function'
					? templateProps.schema(injectedFormData)
					: templateProps.schema
			let lastIf: boolean | undefined = undefined
			return () =>
				normalizedSchema?.reduce<(VNode | VNode[] | undefined)[]>(
					(acc, field) => {
						const normalizedField =
							typeof field === 'function'
								? field(injectedFormData)
								: field
						const {
							vvIs,
							vvName,
							vvSlots,
							vvChildren,
							vvIf,
							vvElseIf,
							vvType,
							vvDefaultValue,
							vvShowValid,
							...props
						} = normalizedField
						// conditions
						if (vvIf !== undefined) {
							lastIf =
								typeof vvIf === 'function'
									? unref(vvIf(injectedFormData))
									: unref(vvIf)
							if (!lastIf) {
								return acc
							}
						} else if (
							vvElseIf !== undefined &&
							lastIf !== undefined
						) {
							if (lastIf) {
								return acc
							}
							lastIf =
								typeof vvElseIf === 'function'
									? unref(vvElseIf(injectedFormData))
									: unref(vvElseIf)
							if (!lastIf) {
								return acc
							}
						} else {
							lastIf = undefined
						}
						// children
						const hChildren = vvChildren
							? h(VvFormTemplate, {
									schema: vvChildren,
							  })
							: undefined
						// render
						if (vvName) {
							acc.push(
								h(
									VvFormField,
									{
										name: vvName,
										is: vvIs,
										type: vvType,
										defaultValue: vvDefaultValue,
										showValid: vvShowValid,
										props,
									},
									vvSlots ?? hChildren,
								),
							)
							return acc
						}
						if (vvIs) {
							acc.push(
								h(
									vvIs as Component,
									props,
									vvSlots ?? hChildren,
								),
							)
							return acc
						}
						if (vvChildren) {
							acc.push(hChildren)
							return acc
						}
						return acc
					},
					[
						templateSlots?.default?.({
							formData: injectedFormData?.formData.value,
							submit: injectedFormData?.submit,
							errors: injectedFormData?.errors.value,
							status: injectedFormData?.status.value,
							invalid: injectedFormData?.invalid.value,
						}),
					],
				)
		},
	})

	/**
	 * An hack to add types to the default slot
	 */
	return VvFormTemplate as typeof VvFormTemplate & {
		new (): {
			$slots: {
				default: (_: {
					formData: unknown extends
						| Partial<TypeOf<Schema>>
						| undefined
						? undefined
						: Partial<TypeOf<Schema>> | undefined
					submit: () => boolean
					errors: Readonly<
						Ref<DeepReadonly<z.inferFormattedError<Schema>>>
					>
					status: Ref<DeepReadonly<`${FormStatus}` | undefined>>
					invalid: Ref<DeepReadonly<boolean>>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				}) => any
			}
		}
	}
}
