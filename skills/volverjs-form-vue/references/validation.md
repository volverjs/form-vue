# Validation, Zod 3/4, defaults, `FormStatus`

## Contents

- [Schema requirements](#schema)
- [Zod 3 vs Zod 4](#zod-versions)
- [Cross-field validation (`superRefine`)](#superrefine)
- [Validation timing](#timing)
- [`FormStatus`](#status)
- [Error shape](#errors)
- [`defaultObjectBySchema`](#default-schema)
- [`defaultObjectByJSONSchema`](#default-json)

<a id="schema"></a>
## Schema requirements

The form schema must be a Zod **object** schema, optionally wrapped in refinements or
modifiers:

```ts
const schema = z.object({
  email: z.string().email(),
  age: z.number().int().positive().optional(),
})
```

Each field's `name`/`vvName` must be a path that exists in the schema. Supported Zod
constructs for default-object generation and binding include `.optional()`,
`.nullable()`, `.default()`, `.coerce`, `.passthrough()`, nested `z.object`, and arrays.

<a id="zod-versions"></a>
## Zod 3 vs Zod 4

`@volverjs/form-vue` supports **Zod `3.25.x` through `4.x`**. It detects the schema
version at runtime and adapts — the API and usage are identical either way.

```ts
// any of these import styles work, matching the installed zod
import { z } from 'zod'        // current major
import { z } from 'zod/v3'     // explicit v3 compat entry
import * as z from 'zod/v4'    // explicit v4 entry
```

Prefer plain `import { z } from 'zod'` unless the project pins a specific entry point.
Everything (`createForm`, `useForm`, `defaultObjectBySchema`) works the same across versions.

<a id="superrefine"></a>
## Cross-field validation (`superRefine`)

For rules that span multiple fields (e.g. "username OR email required"), use Zod's
`.superRefine` on the object schema:

```ts
const schema = z.object({
  hasUsername: z.boolean(),
  username: z.string().optional(),
  email: z.string().email().optional(),
}).superRefine((value, ctx) => {
  if (value.hasUsername && !value.username) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Username is required', path: ['username'] })
  }
  if (!value.hasUsername && !value.email) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email is required', path: ['email'] })
  }
})
```

Set `path` on the issue so the message attaches to the right field. You can also pass an
ad-hoc `superRefine` to `VvForm` (prop) or to `validate(data, { superRefine })` without
baking it into the schema.

<a id="timing"></a>
## Validation timing

- **Default:** the form validates on **submit**. Once it reaches a **valid** state it
  stops re-validating until the next submit. This keeps quiet forms quiet.
- **Continuous:** set `continuousValidation` (option or `VvForm` prop) to validate on
  every change — errors then appear/clear live as the user types. This is usually what
  users mean by "show errors as I type".
- **Subset:** `validate(data, { fields })` or the `validateFields` prop limits validation
  to specific field paths.

<a id="status"></a>
## `FormStatus`

`status` (from the form context) is a `FormStatus` enum value:

| Value | Meaning |
| --- | --- |
| `valid` | Last validation passed. |
| `invalid` | Last validation failed (`invalid` ref is `true`). |
| `submitting` | A submit is in progress. |
| `updated` | Form data changed (transient; resets to `unknown`). |
| `reset` | Form was reset. |
| `unknown` | Idle / no decisive state. |

Prefer reading `status`/`invalid` over inspecting `errors` to decide UI state.

<a id="errors"></a>
## Error shape

`errors` is the **formatted** Zod error tree (`error.format()`-style), keyed by field
path, or `undefined` when there are no errors. Per-field, `VvFormField`'s slot exposes
`invalidLabel` (a `string[]` of messages) and `invalid` — render from those rather than
walking the tree by hand.

<a id="default-schema"></a>
## `defaultObjectBySchema(schema, overrides?)`

Builds a plain object from the schema's `.default()` values, deep-merged with optional
`overrides`. Use it to seed a form's `v-model` so it starts populated — a schema's
defaults do **not** auto-fill the bound object otherwise.

```ts
import { defaultObjectBySchema } from '@volverjs/form-vue'

const schema = z.object({
  firstName: z.string().default('John'),
  lastName: z.string().default('Doe'),
  address: z.object({ street: z.string().default('Main St'), number: z.number().default(1) }),
})

defaultObjectBySchema(schema)
// { firstName: 'John', lastName: 'Doe', address: { street: 'Main St', number: 1 } }

defaultObjectBySchema(schema, { firstName: 'Jane' })
// { firstName: 'Jane', lastName: 'Doe', address: { … } }
```

Handles nested objects, and `.nullable()`, `.coerce`, `.passthrough()` (extra keys in
`overrides` pass through). Wire it into the form:

```ts
const formData = ref(defaultObjectBySchema(schema))
// <VvForm v-model="formData"> …
```

<a id="default-json"></a>
## `defaultObjectByJSONSchema(jsonSchema, overrides?)`

Same idea, but from a **JSON Schema** (e.g. produced by Zod 4's `z.toJSONSchema(...)`).
Use it when your source of truth is JSON Schema rather than a live Zod object.
