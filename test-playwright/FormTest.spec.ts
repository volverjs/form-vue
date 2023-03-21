import { test, expect } from '@playwright/experimental-ct-vue'
import FormTest from './FormTest.vue'

test.use({ viewport: { width: 500, height: 500 } })

test('VvForm with zod schema', async ({ mount }) => {
	const component = await mount(FormTest)

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
