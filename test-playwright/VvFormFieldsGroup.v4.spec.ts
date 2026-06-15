import { it, expect } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import VvFormFieldsGroup from './VvFormFieldsGroup.v4.vue'

it('vvFormFieldsGroup events', async () => {
    let submitted = false
    let mounted = false
    let invalid = false
    let data: unknown

    const screen = render(VvFormFieldsGroup, {
        props: {
            initialData: { firstname: 'John', lastname: 'Doe' },
        },
        attrs: {
            onSubmit: (submittedData: unknown) => {
                submitted = true
                data = submittedData
            },
            onMounted: (initialData: unknown) => {
                mounted = true
                data = initialData
            },
            onInvalid: () => (invalid = true),
            onValid: () => (invalid = false),
        },
    })
    const buttonSubmit = screen.getByRole('button', { name: /submit/i })

    // initial values
    await expect.poll(() => mounted).toBe(true)
    expect(data).toEqual({ firstname: 'John', lastname: 'Doe' })

    // Wait for inputs to be available
    await expect.poll(() =>
        document.querySelector('[name=name]'),
    ).not.toBeNull()
    const nameEl = document.querySelector('[name=name]')
    if (!nameEl)
        throw new Error('[name=name] input not found')
    const inputName = page.elementLocator(nameEl as HTMLElement)
    const surnameEl = document.querySelector('[name=surname]')
    if (!surnameEl)
        throw new Error('[name=surname] input not found')
    const inputSurname = page.elementLocator(surnameEl as HTMLElement)

    await inputName.fill('Jane')
    await inputSurname.fill('Doe')

    // Trigger submit event
    await buttonSubmit.click()

    // Check valid and submitted events
    await expect.poll(() => submitted).toBe(true)
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
    await expect.poll(() => invalid).toBe(true)
    expect(submitted).toBeFalsy()
    expect(data).toBeUndefined()
})
