# Form setup, `VvForm`, `VvFormWrapper`

## Contents

- [Options (`createForm` / `useForm`)](#options)
- [What `useForm` returns (form context)](#form-context)
- [`VvForm` — props, events, slot, exposed methods](#vvform)
- [Programmatic submit / reset / validate](#programmatic)
- [`readonly`](#readonly)
- [`scope` singletons](#scope)
- [Custom data class (`class` / `factory`)](#class)
- [`VvFormWrapper`](#wrapper)

<a id="options"></a>
## Options

`createForm(options)` and `useForm(schema, options)` accept the same option set
(the plugin also takes `schema` and `factory`). When `useForm` is called inside a
component and a plugin is installed, options are **merged over the plugin defaults**.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `lazyLoad` | `boolean` | `false` | Lazy-import the `@volverjs/ui-vue` input components instead of requiring them registered globally. |
| `updateThrottle` | `number` (ms) | `500` | Throttle for `v-model` two-way sync of form data. |
| `continuousValidation` | `boolean` | `false` | Validate on every change instead of only on submit (and re-validate after reaching a valid state). |
| `readonly` | `boolean` | `false` | Start the form read-only. |
| `sideEffects` | `(type) => void \| Promise<void>` | — | Called when a field type is (lazy) loaded; hook for side effects. |
| `scope` | `string` | — | Return a singleton form instance keyed by this string (see [scope](#scope)). |
| `class` | `new (data?) => Type` | — | Constructor used to wrap `formData` (composable). |
| `template` | `FormTemplate` | — | Default template array/function used by `VvForm`/`VvFormTemplate`. |

Plugin-only:

| Option | Type | Meaning |
| --- | --- | --- |
| `schema` | `ZodType` | Schema shared app-wide. If omitted, the plugin only shares default options. |
| `factory` | `(data?) => T` | Plugin equivalent of `class` — builds the form-data model object. |

Install the plugin globally with the `global` install option so the components are
registered as `VvForm` etc.:

```ts
app.use(createForm({ schema }), { global: true })
```

Without `{ global: true }` the plugin still provides the shared options (consumed by
`useForm`), but does **not** register global components.

<a id="form-context"></a>
## What `useForm` returns (form context)

```ts
const {
  // components
  VvForm, VvFormWrapper, VvFormField, VvFormFieldsGroup, VvFormTemplate,
  // reactive state
  formData,   // Ref<Partial<InferSchema> | Type | undefined> — the live form data
  status,     // Readonly<Ref<FormStatus | undefined>> — see references/validation.md
  errors,     // Readonly<Ref<formatted Zod error | undefined>> — keyed by field path
  invalid,    // Readonly<Ref<boolean>> — true when status === 'invalid'
  readonly,   // Ref<boolean> — writable; toggles read-only mode
  wrappers,   // Map<string, wrapper state> — per-named-wrapper validation state
  // methods
  submit,     // () => Promise<boolean> — validates, emits submit if valid, resolves validity
  validate,   // (data?, { fields?, superRefine? }) => Promise<boolean>
  clear,      // () => void — empties the form data
  reset,      // () => void — resets to the initial/default data
  // watch control (advanced)
  ignoreUpdates,    // run a mutation without triggering the throttled v-model watcher
  stopUpdatesWatch, // stop the form-data watcher entirely
} = useForm(schema, options)
```

`formData` is reactive and writable — you can read or set it directly without going
through `v-model` on `VvForm`. This is handy outside a component or when a parent
`v-model` round-trip would be throttled.

<a id="vvform"></a>
## `VvForm`

Renders a `<form>` (configurable via `tag`), validates form data on submit, and emits
status events.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | `object` | `{}` | `v-model` for form data. Also accepts `:model-value` to set only the initial value. |
| `readonly` | `boolean` | option | `v-model:readonly` supported; disables editing. |
| `continuousValidation` | `boolean` | `false` | Per-form override of the option. |
| `tag` | `string` | `'form'` | Root element tag. |
| `template` | `FormTemplate \| Function` | — | Render the form from a template (see `references/template.md`). |
| `superRefine` | `(data, ctx) => void \| Promise` | — | Extra cross-field validation run alongside the schema. |
| `validateFields` | `Path[]` | — | Restrict validation to these field paths. |

### Events

| Event | Payload | When |
| --- | --- | --- |
| `submit` | form data | Submit triggered **and** validation passed. |
| `invalid` | formatted errors | Validation failed. |
| `valid` | form data | Form reached a valid state. |
| `reset` | form data | `reset()` called. |
| `update:modelValue` | form data | Throttled two-way binding. |
| `update:readonly` | `boolean` | Read-only toggled. |

### Default slot scope

```vue
<VvForm v-slot="{ formData, errors, invalid, readonly, status, wrappers, submit, validate, reset, clear }">
  …
</VvForm>
```

These mirror the form context above, so a child can read status/errors without
calling `useForm` again.

### Exposed methods (via template ref)

`submit`, `validate`, `reset`, `clear`, plus the reactive `errors`, `invalid`,
`readonly`, `status`, `valid`, `tag`, `template`.

<a id="programmatic"></a>
## Programmatic submit / reset / validate

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { FormComponent } from '@volverjs/form-vue'

const formEl = ref<InstanceType<FormComponent>>()
async function save() {
  const ok = await formEl.value!.submit() // validates first; resolves true only if valid
  if (ok) { /* the @submit event also fired with the data */ }
}
</script>

<template>
  <VvForm ref="formEl" @submit="onSubmit"><!-- … --></VvForm>
  <button type="button" @click="save">Save</button>
</template>
```

Equivalently, call the `submit`/`reset`/`validate`/`clear` returned by `useForm()`.
`validate(data?, { fields, superRefine })` lets you validate a subset of fields or add
ad-hoc cross-field rules.

<a id="readonly"></a>
## `readonly`

Set via option, the `readonly` prop (`v-model:readonly` to bind), or by mutating the
`readonly` ref from `useForm`. In read-only mode the fields render disabled and
`submit()` is a no-op.

<a id="scope"></a>
## `scope` — singleton forms

`useForm(schema, { scope: 'user-form' })` caches the instance by scope string and
returns the **same** form (same `formData`, `status`, components) on every call with
that scope — across components and modules. Use it to share one form's state between
sibling components (e.g. a multi-step wizard split across files). Omit `scope` for an
independent form per call.

<a id="class"></a>
## Custom data class (`class` / `factory`)

By default `formData` is a plain object. Pass a constructor to wrap it in a model:

```ts
class User {
  firstName = ''
  lastName = ''
  constructor(data?: Partial<User>) { Object.assign(this, data) }
  get fullName() { return `${this.firstName} ${this.lastName}` }
}

const { VvForm, formData } = useForm(schema, { class: User })
// formData.value instanceof User
```

In the plugin use `factory: (data) => new User(data)` instead of `class`.

<a id="wrapper"></a>
## `VvFormWrapper`

Wraps a section of the form and reports its aggregated validation state. It is
`invalid` when **any field inside it — or inside a nested wrapper — is invalid**.

```vue
<VvForm>
  <VvFormWrapper v-slot="{ invalid }" name="contact">
    <fieldset :class="{ 'has-error': invalid }">
      <span v-if="invalid" role="alert">This section has errors</span>
      <VvFormField type="email" name="email" label="Email" />
      <VvFormField type="tel" name="phone" label="Phone" />
    </fieldset>
  </VvFormWrapper>
</VvForm>
```

Wrappers are **nestable** to build a validation tree (e.g. for multi-step forms):

```vue
<VvFormWrapper v-slot="{ invalid }" name="step1">
  <VvFormWrapper v-slot="{ invalid: groupInvalid }" name="step1.address">
    <!-- … -->
  </VvFormWrapper>
</VvFormWrapper>
```

Named wrappers are also reachable via the `wrappers` Map from the form context:

```ts
const { wrappers } = useForm(schema)
const contactInvalid = computed(() => wrappers.get('contact')?.invalid)
```

Each wrapper entry exposes `name`, `invalid`, `readonly`, `errors` (a `Map` of field
path → formatted error), and `fields` (a `Map` of the field names it tracks).
