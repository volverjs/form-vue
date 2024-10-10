import { test, expect } from '@playwright/experimental-ct-vue'
import VvFormWrapper from './VvFormWrapper.vue'

test.use({ viewport: { width: 1000, height: 1000 } })

test('Invalid VvFormWrapper', async ({ mount }) => {
    const component = await mount(VvFormWrapper)

    // check form wrapper fields and invalid state
    const section1 = await component.locator('.form-section-1')

    const invalidMessage = await section1.locator('small.text-danger')
    await expect(invalidMessage).toHaveText('There is a validation error')

    // check form field into wrapper invalid state
    const invalidLabels = await section1.locator('small[role=alert]')
    await expect(invalidLabels).toHaveCount(1)
})

test('Label and Value VvFormField into VvFormWrapper', async ({ mount }) => {
    const component = await mount(VvFormWrapper)

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
    const inputCity = await component.locator('input[name=location\\.city]')
    await expect(inputFirstName).toHaveValue('Massimo')
    await expect(inputSurname).toHaveValue('Rossi')
    await expect(inputCity).toHaveValue('Verona')
})

test('VvFormWrapper partial validation', async ({ mount }) => {
    const component = await mount(VvFormWrapper)

    // Check form wrapper fields and invalid state
    const section1 = await component.locator('.form-section-1')

    const invalidMessage = await section1.locator('small.text-danger')
    const invalidLabels = await component.locator('small[role=alert]')
    await expect(invalidMessage).toHaveText('There is a validation error')
    await expect(invalidLabels).toHaveCount(1)

    // Reset form
    const buttonReset = await component.locator('button[type=reset]')
    await buttonReset.click()

    // check input values
    const inputFirstName = await component.locator('input[name=firstname]')
    const inputSurname = await component.locator('input[name=surname]')
    const inputCity = await component.locator('input[name=location\\.city]')
    await expect(inputFirstName).toHaveValue('')
    await expect(inputSurname).toHaveValue('')
    await expect(inputCity).toHaveValue('')

    // check input labels
    await expect(invalidMessage).toHaveCount(0)
    await expect(invalidLabels).toHaveCount(0)

    // Partial validation
    const partialValidationButton = await component.locator('#validation-button')
    await partialValidationButton.click()

    // check form wrapper fields and invalid state
    await expect(invalidMessage).toHaveText('There is a validation error')
    await expect(invalidLabels).toHaveCount(5)
})
