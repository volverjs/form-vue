// A consumer of the built package, type-checked by `package.test.ts` with the strictest
// resolution a consumer can pick (`nodenext`) and with `skipLibCheck` off, so an error
// inside our declarations fails the check instead of degrading the types to `any`.
// Every `@ts-expect-error` below guards the same thing from the other side: if the
// types degrade to `any`, the expected error disappears and the directive fails.
import * as z from 'zod/v4'
import { defaultObjectBySchema, FormFieldType, useForm } from '@volverjs/form-vue'

const schema = z.object({ email: z.string() })
const { formData, submit, validate } = useForm(schema)

void submit({
    superRefine(value, ctx) {
        if (!value.email.includes('@')) {
            ctx.addIssue({ code: 'custom', message: 'Invalid email', path: ['email'] })
        }
    },
})

// @ts-expect-error `nonExistent` is not in the schema
export const typo = formData.value?.nonExistent

// @ts-expect-error `email` is a string
void validate({ email: 123 })

// @ts-expect-error the default object is not a number
export const badDefault: number = defaultObjectBySchema(schema)

// @ts-expect-error the enum object is not a number
export const badEnum: number = FormFieldType
