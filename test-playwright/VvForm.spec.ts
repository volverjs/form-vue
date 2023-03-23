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
	let valid = false

	const component = await mount(VvForm, {
		props: {
			onSubmit: () => (submitted = true),
			submitForm: () => (submitted = true),
			onInvalid: () => (invalid = true),
			invalid: true,
		},
	})

	// As with any Playwright test, assert locator text.
	await expect(component).toContainText('Submit')

	// Perform first button click. This will trigger the event.
	const button1 = await component.locator('button[type=button]', {
		hasText: 'Submit',
	})
	await button1.click()

	// Assert that submitted event has been fired.
	expect(submitted).toBeTruthy()

	// reset submitted to false
	submitted = false

	// Perform first button click. This will trigger the event.
	const button2 = await component.locator('button[type=submit]')
	await button2.click()

	// Assert that submitted event has NOT been fired (cause of invalid)
	expect(submitted).toBeFalsy()

	// Assert that invalid event has been fired.
	expect(invalid).toBeTruthy()

	// check valid event
	const componentValid = await mount(VvForm, {
		props: {
			onSubmit: () => (submitted = true),
			onValid: () => (valid = true),
			invalid: false,
		},
	})

	// Perform first button click. This will trigger the event.
	const buttonSubmitValid = await componentValid.locator(
		'button[type=submit]',
	)
	await buttonSubmitValid.click()

	// check valid and submitted events
	expect(submitted).toBeTruthy()
	expect(valid).toBeTruthy()
})

test('VvForm continuosValidation', async ({ mount }) => {
	let invalid = false
	let valid = false

	const component = await mount(VvForm, {
		props: {
			onInvalid: () => (invalid = true),
			onValid: () => (valid = true),
			continuosValidation: true,
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
