import { test, expect } from '@playwright/experimental-ct-vue'
import VvFormField from './VvFormField.vue'

test.use({ viewport: { width: 1000, height: 1000 } })

test('Valid VvFormField', async ({ mount }) => {
	const component = await mount(VvFormField)

	// check firstname is valid
	const inputTextFirstName = await component.locator('.vv-input-text--valid')
	await expect(inputTextFirstName).toHaveText('firstname')
})

test('Label and Value VvFormField', async ({ mount }) => {
	const component = await mount(VvFormField)

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
