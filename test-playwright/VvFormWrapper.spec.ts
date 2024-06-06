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
    const invalidCivicNumber = await section1.locator('small[role=alert]')
    await expect(invalidCivicNumber).toHaveText('Required error')
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
    await expect(inputCity).toHaveValue('Verona')
    await expect(inputFirstName).toHaveValue('Massimo')
    await expect(inputSurname).toHaveValue('Rossi')
})
