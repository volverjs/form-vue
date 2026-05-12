import { test, expect } from 'vitest'
import { render } from 'vitest-browser-vue'
import VvFormField from './VvFormField.v4.vue'

test('Valid VvFormField', async () => {
    render(VvFormField)

    // check firstname is valid
    await expect.poll(
        () => document.querySelector('.vv-input-text--valid') !== null,
        { timeout: 10000 },
    ).toBe(true)
})

test('Label and Value VvFormField', async () => {
    const screen = render(VvFormField)

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
