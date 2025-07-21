import { z as z3 } from 'zod/v3'
import * as z4 from 'zod/v4'
import { it, expect } from 'vitest'
import { useForm } from '../src/index'

it('mount component with zod 3', async () => {
    const { VvForm, VvFormField, VvFormWrapper } = useForm(
        z3.object({
            name: z3.string(),
            surname: z3.string(),
        }),
        {
            lazyLoad: true,
        },
    )

    expect(VvForm).toBeTruthy()
    expect(VvFormField).toBeTruthy()
    expect(VvFormWrapper).toBeTruthy()
})


it('mount component with zod 4', async () => {
    const { VvForm, VvFormField, VvFormWrapper } = useForm(
        z4.object({
            name: z4.string(),
            surname: z4.string(),
        }),
        {
            lazyLoad: true,
        },
    )

    expect(VvForm).toBeTruthy()
    expect(VvFormField).toBeTruthy()
    expect(VvFormWrapper).toBeTruthy()
})

