// The consumer in `esm.ts`, written as CommonJS: in a `.cts` file every import compiles to
// `require()`, so TypeScript resolves the `require` condition of the package and reads
// `index.d.cts`. `package.test.ts` type-checks it with `module: "node16"`, which unlike
// `nodenext` does not let a CommonJS file reach into ES module declarations, so the
// `.d.cts` tree has to stand on its own.
import * as z from 'zod/v4'
import { defaultObjectBySchema, FormFieldType, useForm } from '@volverjs/form-vue'

const schema = z.object({
    email: z.string(),
})
const { formData, submit, validate } = useForm(schema)

void submit({
    superRefine(value, ctx) {
        if (!value.email.includes('@')) {
            ctx.addIssue({
                code: 'custom',
                message: 'Invalid email',
                path: ['email'],
            })
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
