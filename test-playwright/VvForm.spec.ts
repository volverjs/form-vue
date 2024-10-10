import { test, expect } from '@playwright/experimental-ct-vue'
import VvForm from './VvForm.vue'

test.use({ viewport: { width: 1000, height: 1000 } })

test('VvForm label and value', async ({ mount }) => {
    const component = await mount(VvForm)

    // check input labels
    const labelFirstName = await component.locator('label', {
        hasText: 'firstname',
    })
    const labelSurname = await component.locator('label', {
        hasText: 'surname',
    })
    await expect(labelFirstName).toHaveText('firstname')
    await expect(labelSurname).toHaveText('surname')

    // check input values
    const inputFirstName = await component.locator('input[name=firstname]')
    const inputSurname = await component.locator('input[name=surname]')
    await expect(inputFirstName).toHaveValue('Massimo')
    await expect(inputSurname).toHaveValue('Rossi')
})

test('VvForm events', async ({ mount }) => {
    let submitted = false
    let invalid = false
    let reset = false

    const component = await mount(VvForm, {
        on: {
            submit: () => (submitted = true),
            invalid: () => (invalid = true),
            reset: () => (reset = true),
        },
    })

    const buttonSubmit = await component.locator('button[type=submit]')
    const buttonReset = await component.locator('button[type=reset]')
    const inputAge = await component.locator('input[name=age]')
    const inputFirstName = await component.locator('input[name=firstname]')
    const inputSurname = await component.locator('input[name=surname]')
    await expect(buttonSubmit).toContainText('Submit')
    await expect(buttonReset).toContainText('Reset')
    await expect(inputAge).toHaveValue('18')
    await expect(inputFirstName).toHaveValue('Massimo')
    await expect(inputSurname).toHaveValue('Rossi')

    // Trigger submit event
    await buttonSubmit.click()

    // Check valid and submitted events
    expect(submitted).toBeTruthy()
    expect(invalid).toBeFalsy()
    expect(reset).toBeFalsy()

    // Reset events
    submitted = false
    invalid = false
    reset = false

    // Set valid input value and submit
    await inputAge.fill('10')
    await buttonSubmit.click()

    // Check valid and submitted events
    expect(submitted).toBeFalsy()
    expect(invalid).toBeTruthy()
    expect(reset).toBeFalsy()

    // Reset events
    submitted = false
    invalid = false
    reset = false

    // Reset form
    await buttonReset.click()
    expect(submitted).toBeFalsy()
    expect(invalid).toBeFalsy()
    expect(reset).toBeTruthy()

    // Check input values
    await expect(inputAge).toHaveValue('')
    await expect(inputFirstName).toHaveValue('')
    await expect(inputSurname).toHaveValue('')
})

test('VvForm continuousValidation', async ({ mount }) => {
    let invalid = false
    let valid = false

    const component = await mount(VvForm, {
        props: {
            continuousValidation: true,
        },
        on: {
            invalid: () => (invalid = true),
            valid: () => (valid = true),
        },
    })

    // check input values
    const inputNumberButtonGroups = await component.locator(
        '.vv-input-text__action-chevron',
    )
    const inputNumberButtonDown = await inputNumberButtonGroups.last()
    const inputNumberButtonUp = await inputNumberButtonGroups.first()
    const inputHint = await component.locator('.vv-input-text__hint')

    await inputNumberButtonDown.click()
    await inputHint.waitFor({ state: 'visible' })

    await inputNumberButtonUp.click()
    await inputHint.waitFor({ state: 'hidden' })
    expect(valid).toBeTruthy()

    await inputNumberButtonDown.click()
    await inputHint.waitFor({ state: 'visible' })
    expect(invalid).toBeTruthy()
})
