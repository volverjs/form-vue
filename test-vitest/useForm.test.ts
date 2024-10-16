import { z } from 'zod'
import { it, expect } from 'vitest'
// @ts-ignore
import { useForm } from '../dist/index.es'

it('mount component', async () => {
    const { VvForm, VvFormField, VvFormWrapper } = useForm(
        z.object({
            name: z.string(),
            surname: z.string(),
        }),
        {
            lazyLoad: true,
        },
    )

    expect(VvForm).toBeTruthy()
    expect(VvFormField).toBeTruthy()
    expect(VvFormWrapper).toBeTruthy()
})
