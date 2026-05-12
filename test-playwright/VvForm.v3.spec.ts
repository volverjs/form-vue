import { expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import VvForm from './VvForm.v3.vue'

it('vvForm label and value', async () => {
    const screen = render(VvForm)

    // check input labels
    await expect.element(screen.getByText('firstname')).toBeInTheDocument()
    await expect.element(screen.getByText('surname')).toBeInTheDocument()

    // check input values
    await expect.poll(() =>
        (document.querySelector('input[name=firstname]') as HTMLInputElement)?.value,
    ).toBe('Massimo')
    await expect.poll(() =>
        (document.querySelector('input[name=surname]') as HTMLInputElement)?.value,
    ).toBe('Rossi')
})

it('vvForm events', async () => {
    let submitted = false
    let invalid = false
    let reset = false

    const screen = render(VvForm, {
        attrs: {
            onSubmit: () => (submitted = true),
            onInvalid: () => (invalid = true),
            onValid: () => (invalid = false),
            onReset: () => (reset = true),
        },
    })

    const buttonSubmit = screen.getByRole('button', { name: /submit/i })
    const buttonReset = screen.getByRole('button', { name: /reset/i })
    await expect.element(buttonSubmit).toHaveTextContent('Submit')
    await expect.element(buttonReset).toHaveTextContent('Reset')
    await expect.poll(() =>
        (document.querySelector('input[name=age]') as HTMLInputElement)?.value,
    ).toBe('18')
    await expect.poll(() =>
        (document.querySelector('input[name=firstname]') as HTMLInputElement)?.value,
    ).toBe('Massimo')
    await expect.poll(() =>
        (document.querySelector('input[name=surname]') as HTMLInputElement)?.value,
    ).toBe('Rossi')

    // Trigger submit event
    await buttonSubmit.click()

    // Check valid and submitted events
    await expect.poll(() => submitted).toBe(true)
    expect(invalid).toBeFalsy()
    expect(reset).toBeFalsy()

    // Reset events
    submitted = false
    invalid = false
    reset = false

    // Set valid input value and submit
    const inputAgeEl = document.querySelector('input[name=age]')
    if (!inputAgeEl)
        throw new Error('input[name=age] not found')
    const inputAge = page.elementLocator(inputAgeEl as HTMLElement)
    await inputAge.fill('10')
    await buttonSubmit.click()

    // Check valid and submitted events
    await expect.poll(() => invalid).toBe(true)
    expect(submitted).toBeFalsy()
    expect(reset).toBeFalsy()

    // Reset events
    submitted = false
    invalid = false
    reset = false

    // Reset form
    await buttonReset.click()
    await expect.poll(() => reset).toBe(true)
    expect(submitted).toBeFalsy()
    // Note: reset may trigger re-validation in zod v3, so invalid may be set

    // Check input values
    await expect.poll(() =>
        (document.querySelector('input[name=age]') as HTMLInputElement)?.value,
    ).toBe('')
    await expect.poll(() =>
        (document.querySelector('input[name=firstname]') as HTMLInputElement)?.value,
    ).toBe('')
    await expect.poll(() =>
        (document.querySelector('input[name=surname]') as HTMLInputElement)?.value,
    ).toBe('')
})

it('vvForm continuousValidation', async () => {
    let invalid = false
    let valid = false

    render(VvForm, {
        props: {
            continuousValidation: true,
        },
        attrs: {
            onInvalid: () => (invalid = true),
            onValid: () => (valid = true),
        },
    })

    // check input values
    await expect.poll(() =>
        document.querySelectorAll('.vv-input-text__action-chevron').length,
    ).toBeGreaterThan(0)
    const inputNumberButtonGroups = document.querySelectorAll('.vv-input-text__action-chevron')
    const inputNumberButtonDown = page.elementLocator(inputNumberButtonGroups[inputNumberButtonGroups.length - 1] as HTMLElement)
    const inputNumberButtonUp = page.elementLocator(inputNumberButtonGroups[0] as HTMLElement)

    await inputNumberButtonDown.click()
    await expect.poll(() =>
        document.querySelector('.vv-input-text__hint'),
    ).not.toBeNull()

    await inputNumberButtonUp.click()
    await expect.poll(() =>
        document.querySelector('.vv-input-text__hint'),
    ).toBeNull()
    expect(valid).toBeTruthy()

    await inputNumberButtonDown.click()
    await expect.poll(() =>
        document.querySelector('.vv-input-text__hint'),
    ).not.toBeNull()
    expect(invalid).toBeTruthy()
})
