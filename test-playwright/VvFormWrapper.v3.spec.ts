import { test, expect } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import VvFormWrapper from './VvFormWrapper.v3.vue'

test('Invalid VvFormWrapper', async () => {
    render(VvFormWrapper)

    // check form wrapper fields and invalid state
    await expect.poll(() =>
        document.querySelector('#section-wrapper-hint')?.textContent,
    ).toBe('There is a validation error in this section')

    // check form field into wrapper invalid state - wait for lazy components
    await expect.poll(
        () => document.querySelectorAll('input').length,
        { timeout: 10000 },
    ).toBeGreaterThan(0)
    // Now check for validation errors
    await expect.poll(
        () => document.querySelectorAll('small[role=alert]').length,
        { timeout: 10000 },
    ).toBe(1)
})

test('Label and Value VvFormField into VvFormWrapper', async () => {
    const screen = render(VvFormWrapper)

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
    await expect.poll(() =>
        (document.querySelector('input[name="location.city"]') as HTMLInputElement)?.value,
    ).toBe('Verona')
})

test('VvFormWrapper partial validation', async () => {
    render(VvFormWrapper)

    // Wait for lazy components to load
    await expect.poll(
        () => document.querySelectorAll('input').length,
        { timeout: 10000 },
    ).toBeGreaterThan(0)

    // Check form wrapper fields and invalid state
    await expect.poll(() =>
        document.querySelector('#section-wrapper-hint')?.textContent,
    ).toBe('There is a validation error in this section')
    await expect.poll(
        () => document.querySelectorAll('small[role=alert]').length,
        { timeout: 10000 },
    ).toBe(1)

    // Reset form
    const buttonReset = page.elementLocator(document.querySelector('button[type=reset]') as HTMLElement)
    await buttonReset.click()

    // check input values
    await expect.poll(() =>
        (document.querySelector('input[name=firstname]') as HTMLInputElement)?.value,
    ).toBe('')
    await expect.poll(() =>
        (document.querySelector('input[name=surname]') as HTMLInputElement)?.value,
    ).toBe('')
    await expect.poll(() =>
        (document.querySelector('input[name="location.city"]') as HTMLInputElement)?.value,
    ).toBe('')

    // check input labels
    await expect.poll(() =>
        document.querySelector('#section-wrapper-hint'),
    ).toBeNull()
    await expect.poll(() =>
        document.querySelectorAll('small[role=alert]').length,
    ).toBe(0)

    // Partial validation
    const partialValidationButton = page.elementLocator(document.querySelector('#validation-button') as HTMLElement)
    await partialValidationButton.click()

    // check form wrapper fields and invalid state
    await expect.poll(() =>
        document.querySelector('#section-wrapper-hint')?.textContent,
    ).toBe('There is a validation error in this section')
    await expect.poll(
        () => document.querySelectorAll('small[role=alert]').length,
        { timeout: 10000 },
    ).toBe(5)
})
