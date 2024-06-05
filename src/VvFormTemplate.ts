import { get } from 'ts-dot-prop'
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
import type { FormSchema, InjectedFormData, FormTemplate, RenderFunctionOutput } from './types'
import type { FormStatus } from './enums'

export function defineFormTemplate<Schema extends FormSchema>(formProvideKey: InjectionKey<InjectedFormData<Schema>>,	VvFormField: Component) {
    const VvFormTemplate = defineComponent({
        name: 'VvFormTemplate',
        props: {
            schema: {
                type: [Array, Function] as PropType<FormTemplate<Schema>>,
                required: true,
            },
            scope: {
                type: Object as PropType<Record<string, unknown>>,
                default: () => ({}),
            },
        },
        setup(templateProps, { slots: templateSlots }) {
            const injectedFormData = inject(formProvideKey)
            if (!injectedFormData?.formData)
                return
            return () => {
                const normalizedSchema
					= typeof templateProps.schema === 'function'
					    ? templateProps.schema(
					        injectedFormData,
					        templateProps.scope,
					    )
					    : templateProps.schema
                let lastIf: boolean | undefined
                const toReturn = normalizedSchema.reduce<
                (VNode | VNode[] | undefined)[]
                    >((acc, field) => {
                        const normalizedField
						= typeof field === 'function'
						    ? field(injectedFormData, templateProps.scope)
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
                            vvContent,
                            ...props
                        } = normalizedField

                        // conditions
                        if (vvIf !== undefined) {
                            if (typeof vvIf === 'string') {
                                lastIf = Boolean(
                                    get(
                                        Object(injectedFormData.formData.value),
                                        vvIf,
                                    ),
                                )
                            }
                            else if (typeof vvIf === 'function') {
                                lastIf = unref(vvIf(injectedFormData))
                            }
                            else {
                                lastIf = unref(vvIf)
                            }
                            if (!lastIf) {
                                return acc
                            }
                        }
                        else if (vvElseIf !== undefined && lastIf !== undefined) {
                            if (lastIf) {
                                return acc
                            }
                            if (typeof vvElseIf === 'string') {
                                lastIf = Boolean(
                                    get(
                                        Object(injectedFormData.formData.value),
                                        vvElseIf,
                                    ),
                                )
                            }
                            else if (typeof vvElseIf === 'function') {
                                lastIf = unref(vvElseIf(injectedFormData))
                            }
                            else {
                                lastIf = unref(vvElseIf)
                            }
                            if (!lastIf) {
                                return acc
                            }
                        }
                        else {
                            lastIf = undefined
                        }

                        // children
                        let hChildren: RenderFunctionOutput | { default: (scope: Record<string, unknown>) => RenderFunctionOutput } | undefined
                        if (vvChildren) {
                            if (typeof vvIs === 'string') {
                                hChildren = h(VvFormTemplate, {
                                    schema: vvChildren,
                                })
                            }
                            else {
                                hChildren = {
                                    default: (scope: Record<string, unknown>) =>
                                        h(VvFormTemplate, {
                                            schema: vvChildren,
                                            scope,
                                        }),
                                }
                            }
                        }

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
                                    vvSlots ?? hChildren ?? vvContent,
                                ),
                            )
                            return acc
                        }
                        if (vvIs) {
                            acc.push(
                                h(
                                    vvIs as Component,
                                    props,
                                    vvSlots ?? hChildren ?? vvContent,
                                ),
                            )
                            return acc
                        }
                        if (hChildren) {
                            if ('default' in hChildren) {
                                acc.push(hChildren.default(templateProps.scope))
                            }
                            else {
                                acc.push(hChildren)
                            }
                            return acc
                        }
                        return acc
                    }, [])
                toReturn.push(
                    templateSlots?.default?.({
                        formData: injectedFormData?.formData.value,
                        submit: injectedFormData?.submit,
                        validate: injectedFormData?.validate,
                        errors: injectedFormData?.errors.value,
                        status: injectedFormData?.status.value,
                        invalid: injectedFormData?.invalid.value,
                    }),
                )
                return toReturn
            }
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
                    submit: () => Promise<boolean>
                    validate: () => Promise<boolean>
                    errors: Readonly<
						Ref<DeepReadonly<z.inferFormattedError<Schema>>>
					>
                    status: Ref<DeepReadonly<`${FormStatus}` | undefined>>
                    invalid: Ref<DeepReadonly<boolean>>
                }) => any
            }
        }
    }
}
