import * as z4 from 'zod/v4'
import { it, expect, describe } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { useForm } from '../src/index'

/**
 * `VvFormField` and `VvFormFieldsGroup` declare their `props` prop without a default (the
 * comment on the prop says why), so they must render when it is absent, and when its
 * function form returns `undefined`, which its signature allows and which used to throw
 * in `Object.keys()`.
 *
 * `is: 'input'` renders the forwarded props as attributes of a plain element, so what
 * reaches the field can be read straight off the DOM.
 */

const schema = z4.object({ email: z4.string(), name: z4.string() })

describe.each(['VvFormField', 'VvFormFieldsGroup'] as const)('%s', (component) => {
    function mountField(fieldProps?: unknown) {
        const { VvForm, VvFormField, VvFormFieldsGroup } = useForm(schema, { lazyLoad: true })
        return mount(VvForm, {
            props: { modelValue: { email: '', name: '' } },
            slots: {
                default: () => component === 'VvFormField'
                    ? h(VvFormField, { name: 'email', is: 'input', props: fieldProps as never })
                    : h(VvFormFieldsGroup, { names: ['email', 'name'], is: 'input', props: fieldProps as never }),
            },
        })
    }

    it('renders when the props prop is absent', () => {
        const wrapper = mountField()
        expect(wrapper.find('input').exists()).toBe(true)
        wrapper.unmount()
    })

    it('renders when the props function returns undefined', () => {
        const wrapper = mountField(() => undefined)
        expect(wrapper.find('input').exists()).toBe(true)
        wrapper.unmount()
    })

    it('forwards the props object', () => {
        const wrapper = mountField({ placeholder: 'Email' })
        expect(wrapper.find('input').attributes('placeholder')).toBe('Email')
        wrapper.unmount()
    })

    it('forwards what the props function returns', () => {
        const wrapper = mountField(() => ({ placeholder: 'Email' }))
        expect(wrapper.find('input').attributes('placeholder')).toBe('Email')
        wrapper.unmount()
    })
})
