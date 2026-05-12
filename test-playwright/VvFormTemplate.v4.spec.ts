import { it, expect } from 'vitest'
import { render } from 'vitest-browser-vue'
import VvFormTemplate from './VvFormTemplate.v4.vue'

it('valid VvFormTemplate', async () => {
    render(VvFormTemplate)

    // check firstname is valid
    await expect.poll(
        () => document.querySelector('.vv-input-text--valid') !== null,
        { timeout: 10000 },
    ).toBe(true)
})

it('label and value VvFormTemplate', async () => {
    const screen = render(VvFormTemplate)

    // check input labels
    await expect.element(screen.getByText('firstname')).toBeInTheDocument()
    await expect.element(screen.getByText('surname')).toBeInTheDocument()
    await expect.element(screen.getByText('city')).toBeInTheDocument()

    // check input values
    await expect.poll(() =>
        (document.querySelector('input[name=firstname]') as HTMLInputElement)?.value,
    ).toBe('Massimo')
    await expect.poll(() =>
        (document.querySelector('input[name=surname]') as HTMLInputElement)?.value,
    ).toBe('Rossi')
})
