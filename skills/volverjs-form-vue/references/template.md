# `VvFormTemplate` — schema-driven forms

`VvFormTemplate` renders an entire form from a declarative **array of items** instead
of hand-written markup. Each item describes one field (or layout node). This is ideal
for dynamic, config-driven, or repetitive forms.

```vue
<script setup lang="ts">
import { useForm } from '@volverjs/form-vue'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  address: z.object({ street: z.string(), city: z.string(), zip: z.number() }),
})

const templateSchema = [
  { vvName: 'firstName', vvType: 'text', label: 'First Name' },
  { vvName: 'lastName', vvType: 'text', label: 'Last Name' },
  {
    vvIs: 'div',
    class: 'grid grid-cols-3 gap-4',
    vvChildren: [
      { vvName: 'address.street', vvType: 'text', label: 'Street', class: 'col-span-2' },
      { vvName: 'address.city', vvType: 'text', label: 'City' },
      { vvName: 'address.zip', vvType: 'number', label: 'Zip' },
    ],
  },
]

const { VvForm, VvFormTemplate } = useForm(schema)
</script>

<template>
  <VvForm>
    <VvFormTemplate :schema="templateSchema" />
  </VvForm>
</template>
```

You can also pass the template via the `template` prop/option on `VvForm` instead of
the child component.

## Item properties

An item is rendered as a `VvFormField` by default. **Any property not listed below is
passed straight through to the rendered component as a prop** (e.g. `label`, `class`,
`placeholder`, `options`).

| Property | Type | Meaning |
| --- | --- | --- |
| `vvName` | schema path | Field name (dot notation for nested). |
| `vvType` | `FormFieldType` | Field type — same values as `VvFormField`'s `type` (see `references/fields.md`). |
| `vvIs` | `string \| Component` | Render this element/component instead of `VvFormField` (e.g. `'div'` for layout). |
| `vvChildren` | `item[] \| (ctx, scope) => item[]` | Nested items wrapped inside this item. |
| `vvIf` | path \| `(ctx) => boolean` \| `Ref` | Conditional rendering (see below). |
| `vvElseIf` | path \| `(ctx) => boolean` \| `true` | Else-branch of a preceding `vvIf`. |
| `vvDefaultValue` | any | Default value for the field. |
| `vvShowValid` | `boolean` | Show the valid state, not only errors. |
| `vvSlots` | `Record<string, any>` | Slots to pass into the rendered item. |
| `vvContent` | `string` | Text/HTML content for non-field elements (with `vvIs`). |

## Conditional rendering — `vvIf` / `vvElseIf`

`vvIf` and `vvElseIf` accept either a **string** (treated as a form-data property path,
truthy → render) or a **function** receiving the form context and returning a boolean.

```ts
const templateSchema = [
  { vvName: 'hasUsername', vvType: 'checkbox', label: 'Has username', value: true, uncheckedValue: false },
  // string form: render when formData.hasUsername is truthy
  { vvIf: 'hasUsername', vvName: 'username', vvType: 'text', label: 'Username' },
  // vvElseIf: true acts as the else branch
  { vvElseIf: true, vvName: 'email', vvType: 'email', label: 'Email' },
]
```

Function form, with access to the reactive form context:

```ts
const templateSchema = [
  {
    vvIf: ctx => ctx.formData.value.hasUsername,
    vvName: 'username', vvType: 'text', label: 'Username',
  },
]
```

`vvElseIf` can appear multiple times; `vvElseIf: true` is the final `else`, rendered
when all preceding `vvIf`/`vvElseIf` conditions were false.

Pair conditional template items with schema-level cross-field rules (`.superRefine`)
so the validation matches what's visible — see `references/validation.md`.

## Function items and function schemas

The whole template, individual items, and `vvChildren` can each be a **function** of
the form context — letting labels/content react to form data:

```ts
// whole schema as a function
function templateSchema(ctx) {
  return [
    { vvName: 'firstName', vvType: 'text', label: `Hi ${ctx.formData.value.firstName ?? ''}!` },
  ]
}

// a single item as a function (mixed with static items)
const templateSchema = [
  ctx => ({ vvName: 'firstName', vvType: 'text', label: `Hi ${ctx.formData.value.firstName}!` }),
  { vvName: 'username', vvType: 'text', label: 'Username' },
]
```

The context argument is the form context (`formData`, `errors`, `status`, … — see
`references/form.md`). A second `scope` argument is passed to child item functions for
loop/local data.
