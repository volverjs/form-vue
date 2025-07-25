import { test, expect } from '@playwright/experimental-ct-vue'
import VvFormFieldsGroup from './VvFormFieldsGroup.v4.vue'

test.use({ viewport: { width: 1000, height: 1000 } })

test('VvFormFieldsGroup events', async ({ mount }) => {
    let submitted = false
    let mounted = false
    let invalid = false
    let data: unknown

    const component = await mount(VvFormFieldsGroup, {
        props: {
            initialData: { firstname: 'John', lastname: 'Doe' },
        },
        on: {
            submit: (submittedData: unknown) => {
                submitted = true
                data = submittedData
            },
            mounted: (initialData: unknown) => {
                mounted = true
                data = initialData
            },
            invalid: () => (invalid = true),
            valid: () => (invalid = false),
        },
    })
    const buttonSubmit = await component.locator('button[type=submit]')
    const inputName = await component.locator('[name=name]')
    const inputSurname = await component.locator('[name=surname]')

    // inital values
    expect(mounted).toBeTruthy()
    expect(data).toEqual({ firstname: 'John', lastname: 'Doe' })

    await inputName.fill('Jane')
    await inputSurname.fill('Doe')

    // Trigger submit event
    await buttonSubmit.click()

    // Check valid and submitted events
    expect(submitted).toBeTruthy()
    expect(invalid).toBeFalsy()
    expect(data).toEqual({ firstname: 'Jane', lastname: 'Doe' })

    // Reset events
    submitted = false
    invalid = false
    data = undefined

    await inputName.fill('')
    await inputSurname.fill('')
    await buttonSubmit.click()

    // Check invalid event
    expect(submitted).toBeFalsy()
    expect(invalid).toBeTruthy()
    expect(data).toBeUndefined()
})
