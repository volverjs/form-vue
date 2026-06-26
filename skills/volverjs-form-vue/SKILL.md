---
name: volverjs-form-vue
description: >-
  Build Vue 3 forms with the @volverjs/form-vue library, which turns a Zod
  object schema into validated forms rendered with @volverjs/ui-vue components.
  Use this skill whenever the user works with @volverjs/form-vue or mentions
  createForm, useForm, VvForm, VvFormField, VvFormFieldsGroup, VvFormWrapper,
  VvFormTemplate, defaultObjectBySchema, or a "form template schema" with
  vvName/vvType/vvIf — and also whenever they ask to build, validate, or
  scaffold a Vue 3 form from a Zod schema (login, signup, settings, nested
  address, conditional fields, field groups, programmatic submit/reset), even if
  they don't name the library explicitly. Covers the plugin vs composable setup,
  the five components and their props/events/slot scopes, schema-driven
  templates, Zod 3 and Zod 4 support, default-object generation, and validation
  patterns (continuous validation, superRefine, readonly, scopes).
---

# @volverjs/form-vue

`@volverjs/form-vue` turns a [Zod](https://zod.dev) object schema into a Vue 3
form. The schema is the **single source of truth**: it defines the fields, their
types, defaults, and validation rules. The library renders the fields (by default
as [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) inputs) and keeps the
form data, validation status, and per-field errors reactive.

You help users wire up a form and write correct, idiomatic code. Read the
relevant `references/*.md` file before writing non-trivial code — they hold the
full prop/event/option tables, and this main file stays deliberately short so it
loads fast.

## When this applies

- Setting up a form with `createForm()` (plugin) or `useForm()` (composable).
- Rendering fields with `VvFormField`, grouping with `VvFormFieldsGroup`,
  sectioning with `VvFormWrapper`, or generating the whole form from a
  `VvFormTemplate` schema array.
- Reasoning about validation timing, errors, `readonly`, `scope` singletons,
  default values, or Zod 3 vs Zod 4 compatibility.

Default stack for examples: **Vue 3 SFC + `<script setup lang="ts">` + Zod**.
Adapt if the user is on JS, Options API, or renders custom inputs instead of
`@volverjs/ui-vue`.

## Mental model (read this first)

Five ideas explain almost every behavior. Keep them straight and the API is predictable:

- **Schema is the source of truth.** A `z.object({...})` schema defines fields,
  defaults, and rules. `useForm(schema)` / `createForm({ schema })` build the form
  machinery from it. The inferred type flows through `formData` and `errors`.
- **Components bind by `name`/`names`.** Each field declares the schema path it
  edits via `name` (dot notation for nested: `address.city`). The library reads/writes
  `formData` at that path and surfaces that path's errors — you never wire
  `v-model` per field by hand.
- **Validation runs on submit, then tracks status.** By default the form validates
  when submitted and, once valid, **stops** re-validating until the next submit.
  Set `continuousValidation` to validate on every change. `status` (a `FormStatus`)
  drives the `valid`/`invalid`/`submit`/`reset` events.
- **Wrappers aggregate a subtree.** `VvFormWrapper` is `invalid` if any field inside
  it (or any nested wrapper) is invalid — useful for section-level error UI and
  multi-step forms. The `wrappers` Map exposes each wrapper's state.
- **Two-way binding is throttled.** `v-model` on `VvForm` syncs `formData` back to
  the parent, throttled by `updateThrottle` (default 500ms) to avoid churn.

## Install

```bash
pnpm add @volverjs/form-vue @volverjs/ui-vue @vueuse/core dot-prop zod vue
```

`@volverjs/ui-vue`, `@vueuse/core`, `dot-prop`, `vue`, and `zod` are peer
dependencies. Zod can be **3.25+ or 4.x** — the library detects the version and
adapts (see `references/validation.md`). `@volverjs/ui-vue` is only needed if you
render the built-in input types; pure custom-input or slot-based forms don't require it.

## Two ways to create a form

Both produce the same five components. Pick based on scope:

**Plugin** — `createForm()` registers `VvForm`/`VvFormField`/… globally and shares
default options app-wide. Good when one schema (or shared defaults) serves the whole app:

```ts
import { createApp } from 'vue'
import { createForm } from '@volverjs/form-vue'
import { z } from 'zod' // Zod 4. For Zod 3.25+ use `import { z } from 'zod/v3'` — both are supported.

const form = createForm({
  schema: z.object({ firstName: z.string(), lastName: z.string() }),
  // updateThrottle, continuousValidation, lazyLoad, readonly, scope, class … (see references/form.md)
})

createApp(App).use(form, { global: true }).mount('#app')
```

If `schema` is omitted, the plugin only shares **default options** to forms created
later with the composable.

**Composable** — `useForm(schema, options)` builds a form inside (or outside) a
component. Default options are **inherited from the plugin** when called inside a
component; called outside one, they are not. This is the common case:

```vue
<script setup lang="ts">
import { useForm } from '@volverjs/form-vue'
import { z } from 'zod' // Zod 4. For Zod 3.25+ use `import { z } from 'zod/v3'` — both are supported.

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
})

const { VvForm, VvFormField } = useForm(schema)
</script>

<template>
  <VvForm @submit="onSubmit" @invalid="onInvalid">
    <VvFormField type="text" name="firstName" label="First Name" />
    <VvFormField type="text" name="lastName" label="Last Name" />
    <button type="submit">Submit</button>
  </VvForm>
</template>
```

`useForm()` returns the components plus reactive form state and methods:

```ts
const {
  VvForm, VvFormWrapper, VvFormField, VvFormFieldsGroup, VvFormTemplate, // components
  formData, status, errors, invalid, readonly, wrappers,                 // reactive state
  submit, validate, clear, reset,                                        // methods
  ignoreUpdates, stopUpdatesWatch,                                       // watch control
} = useForm(schema)
```

## The five components

Each has a dedicated reference — open the one you need before writing real code:

- **`VvForm`** → `references/form.md`. Renders a `<form>`, validates on submit,
  emits `submit`/`invalid`/`valid`/`reset`, supports `v-model` (data) and
  `v-model:readonly`. Exposes `submit()`/`validate()`/`reset()`/`clear()`.
- **`VvFormField`** → `references/fields.md`. One field bound to a schema `name`.
  `type` renders a `@volverjs/ui-vue` input; `:is` renders a custom component; the
  default slot exposes `{ modelValue, onUpdate, invalid, invalidLabel, … }` for
  fully custom markup. Can be nested for group validation.
- **`VvFormFieldsGroup`** → `references/fields.md`. Binds several fields at once via
  `names` (array or `{ vModel: 'path' }` map); slot exposes `{ modelValue, invalids,
  invalidLabels, onUpdateField }`.
- **`VvFormWrapper`** → `references/form.md`. Sections the form; slot exposes
  `{ invalid }`, aggregated from the fields/wrappers inside it. Nestable.
- **`VvFormTemplate`** → `references/template.md`. Renders an entire form from a
  declarative array of items (`vvName`/`vvType`/`vvIf`/`vvChildren`…) instead of
  hand-written markup. Great for dynamic or config-driven forms.

## Schema utilities

- **`defaultObjectBySchema(schema, overrides?)`** builds a default form-data object
  from a Zod schema's `.default()` values, merged with optional overrides. Use it to
  seed `v-model` so the form starts populated. → `references/validation.md`.
- **`defaultObjectByJSONSchema(jsonSchema, overrides?)`** does the same from a JSON
  Schema (Zod 4). → `references/validation.md`.
- **`FormFieldType`** enum lists every `type` value `VvFormField`/`vvType` accepts.

## Best practices & gotchas

- **The schema must be a `z.object(...)`** (optionally wrapped in `.superRefine`,
  `.passthrough`, etc.). Field `name`s must be **paths that exist in the schema** —
  a typo'd or non-schema name won't bind. Use dot notation for nesting.
- **Don't destructure away reactivity.** `formData`, `status`, `errors`, `invalid`
  are refs/computeds — keep them as refs and let the template unwrap them.
- **Validation stops at the first valid state by default.** If you expect errors to
  clear/appear live as the user types, you want `continuousValidation` (option on
  `useForm`/`createForm`, or prop on `VvForm`). Otherwise it only re-validates on submit.
- **`v-model` is throttled (500ms).** If a parent watcher seems to lag behind typing,
  that's the throttle — tune `updateThrottle`, or read `formData` from the composable
  directly (it updates without the parent round-trip).
- **Seed defaults explicitly.** A schema with `.default()` values doesn't auto-populate
  the bound `v-model` object; generate it with `defaultObjectBySchema(schema)`.
- **`scope` makes a singleton.** `useForm(schema, { scope: 'x' })` returns the *same*
  form instance for the same scope string across calls/components — intentional for
  sharing one form across components, a footgun if accidental.
- **Programmatic submit:** `ref` the `VvForm` and call `formEl.value.submit()`, or call
  the `submit()` returned by `useForm()`. Both validate first and only emit `submit`
  (resolve `true`) when valid.
- **Custom data class:** pass `class` (composable) / `factory` (plugin) to wrap
  `formData` in your own model type instead of a plain object. → `references/form.md`.

## Reference files

- `references/form.md` — `createForm`/`useForm` options, `VvForm` props/events/slots/
  exposed methods, `VvFormWrapper`, the form context returned by `useForm`, `readonly`,
  `scope`, `class`/`factory`.
- `references/fields.md` — `VvFormField` (slot scope, `type`→ui-vue mapping, `:is`
  custom components, nesting, events) and `VvFormFieldsGroup` (`names` array/object map,
  slot scope, custom group components).
- `references/template.md` — `VvFormTemplate`: item properties (`vvIs`, `vvName`,
  `vvType`, `vvChildren`, `vvIf`/`vvElseIf`, `vvSlots`, `vvDefaultValue`, `vvShowValid`,
  `vvContent`), conditional rendering, function items, nested layout.
- `references/validation.md` — Zod 3 vs Zod 4 support, `superRefine`/cross-field rules,
  `FormStatus`, `defaultObjectBySchema`, `defaultObjectByJSONSchema`, error shapes.
