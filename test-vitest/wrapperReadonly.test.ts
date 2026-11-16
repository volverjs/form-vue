import * as z4 from 'zod/v4'
import { it, expect, describe } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useForm } from '../src/index'

/**
 * `VvFormWrapper` is readonly when its own `readonly` prop is set or when the form is.
 * That effective value used to be returned from `setup()` as `readonly`, shadowing the
 * prop of the same name, so a template ref read it there. It is `isReadonly` now (the
 * name `VvForm` uses), while `readonly` on a ref is the prop. The slot's `readonly` stays
 * the effective value.
 */

function mountWrapper({ formReadonly, wrapperReadonly }: { formReadonly: boolean, wrapperReadonly: boolean }) {
    const { VvForm, VvFormWrapper } = useForm(z4.object({ email: z4.string() }), { lazyLoad: true })
    const wrapperRef = ref<{ readonly: boolean, isReadonly: boolean }>()
    const slot: { readonly?: boolean } = {}
    const form = mount(VvForm, {
        props: { modelValue: { email: '' }, readonly: formReadonly },
        slots: {
            default: () => h(VvFormWrapper, { name: 'contact', readonly: wrapperReadonly, ref: wrapperRef }, {
                default: (scope: { readonly: boolean }) => {
                    slot.readonly = scope.readonly
                    return null
                },
            }),
        },
    })
    return { form, wrapperRef, slot }
}

describe('VvFormWrapper readonly', () => {
    it.each([
        { formReadonly: false, wrapperReadonly: false, effective: false },
        { formReadonly: true, wrapperReadonly: false, effective: true },
        { formReadonly: false, wrapperReadonly: true, effective: true },
    ])('form $formReadonly, wrapper $wrapperReadonly', async ({ formReadonly, wrapperReadonly, effective }) => {
        const { form, wrapperRef, slot } = mountWrapper({ formReadonly, wrapperReadonly })
        // VvForm applies its `readonly` prop after the first render.
        await nextTick()
        expect(slot.readonly).toBe(effective)
        expect(wrapperRef.value?.isReadonly).toBe(effective)
        expect(wrapperRef.value?.readonly).toBe(wrapperReadonly)
        form.unmount()
    })
})
