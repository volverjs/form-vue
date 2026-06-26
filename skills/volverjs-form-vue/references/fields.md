# `VvFormField` and `VvFormFieldsGroup`

## Contents

- [`VvFormField`](#field)
  - [Default slot (custom markup)](#field-slot)
  - [`type` — render a @volverjs/ui-vue input](#field-type)
  - [`:is` — render a custom component](#field-is)
  - [Events](#field-events)
  - [Nested fields (group validation)](#field-nested)
- [`VvFormFieldsGroup`](#group)

<a id="field"></a>
## `VvFormField`

Renders one field bound to a schema path via `name`. There are three ways to render
the control, in increasing order of control: a built-in `type`, a custom `:is`
component, or fully custom markup via the default slot.

Key props:

| Prop | Type | Notes |
| --- | --- | --- |
| `name` | schema path | Required. Dot notation for nested: `address.city`. Binds form data and surfaces this path's errors. |
| `type` | `FormFieldType` | Render a `@volverjs/ui-vue` input (see mapping below). |
| `is` | `string \| Component` | Render a custom component instead. |
| `label` | `string` | Passed to the ui-vue input. |
| `lazyLoad` | `boolean` | Lazy-import the ui-vue component for this field. |

Any prop not consumed by `VvFormField` is **forwarded to the rendered component**
(e.g. `placeholder`, `options`, `disabled`).

<a id="field-slot"></a>
### Default slot — fully custom markup

Use the slot when you render your own `<input>`/markup. The slot scope gives you
everything to wire it up:

```vue
<VvFormField
  v-slot="{ modelValue, onUpdate, invalid, invalidLabel, errors, formData, formErrors }"
  name="lastName"
>
  <label for="lastName">Last Name</label>
  <input
    id="lastName"
    type="text"
    :value="modelValue"
    :aria-invalid="invalid"
    :aria-errormessage="invalid ? 'lastName-alert' : undefined"
    @input="onUpdate"
  >
  <small v-if="invalid" id="lastName-alert" role="alert">{{ invalidLabel }}</small>
</VvFormField>
```

| Slot prop | Type | Meaning |
| --- | --- | --- |
| `modelValue` | field value | Current value at `name`. |
| `onUpdate` | event/value handler | Write the new value back to form data. Accepts a DOM `event` or a raw value. |
| `invalid` | `boolean` | This field is invalid. |
| `invalidLabel` | `string[]` | This field's validation messages. |
| `errors` | formatted error | Raw errors for this field path. |
| `formData` | object | The whole form data. |
| `formErrors` | formatted error | Errors for the whole form. |

<a id="field-type"></a>
### `type` — render a @volverjs/ui-vue input

```vue
<VvFormField type="text" name="username" label="Username" />
<VvFormField type="password" name="password" label="Password" />
<VvFormField type="select" name="role" label="Role" :options="roleOptions" />
```

`type` accepts any `FormFieldType` value. Mapping to ui-vue components:

| `type` value(s) | Component |
| --- | --- |
| `text`, `number`, `email`, `password`, `tel`, `url`, `search`, `date`, `time`, `datetime-local`, `month`, `week`, `color` | `VvInputText` |
| `select` | `VvSelect` |
| `checkbox` | `VvCheckbox` |
| `checkboxGroup` | `VvCheckboxGroup` |
| `radio` | `VvRadio` |
| `radioGroup` | `VvRadioGroup` |
| `textarea` | `VvTextarea` |
| `combobox` | `VvCombobox` |
| `custom` | use `:is` / slot instead |

By default ui-vue components must be **registered globally**; set `lazyLoad` (option
or per-field prop) to import them on demand. Import the `FormFieldType` enum from
`@volverjs/form-vue` if you want type-safe values.

<a id="field-is"></a>
### `:is` — custom component

Render your own input component and the library wires `modelValue`/`update:modelValue`
plus `invalid`/`valid`/`invalidLabel` props for you:

```vue
<script setup lang="ts">
import MyInput from './MyInput.vue'
</script>

<template>
  <VvFormField :is="MyInput" name="username" />
</template>
```

The custom component should accept `modelValue`, `invalid`, `valid`, `invalidLabel`
(and `name`) props and emit `update:modelValue`.

<a id="field-events"></a>
### Events

`VvFormField` emits `invalid`, `valid`, and `update:modelValue`:

```vue
<VvFormField name="username" @invalid="onInvalid" @valid="onValid" @update:model-value="onChange" />
```

<a id="field-nested"></a>
### Nested fields (group validation)

A `VvFormField` can wrap child `VvFormField`s to validate an object node as a group —
for example a schema node with a `.superRefine` that checks the whole sub-object. The
outer field's `name` points at the parent node; its `invalid`/`invalidLabel` reflect
the node-level errors:

```vue
<VvFormField v-slot="{ invalid, invalidLabel }" name="shoppingList">
  <VvFormField
    v-for="key in ['bread', 'milk', 'tomato']"
    :key="key"
    type="number"
    :name="`shoppingList.${key}`"
    :label="`Number of ${key}`"
  />
  <template v-if="invalid">
    <small v-for="(hint, i) in invalidLabel" :key="i">{{ hint }}</small>
  </template>
</VvFormField>
```

<a id="group"></a>
## `VvFormFieldsGroup`

Binds **several** fields at once and exposes them through one slot scope — useful for
laying out related fields together or feeding a custom multi-field component.

`names` can be an **array** of schema paths:

```vue
<VvFormFieldsGroup
  v-slot="{ modelValue, invalids, invalidLabels, onUpdateField }"
  :names="['firstName', 'lastName']"
>
  <fieldset>
    <input
      :value="modelValue.firstName"
      :aria-invalid="invalids.firstName"
      @input="onUpdateField('firstName', $event)"
    >
    <small v-if="invalids.firstName">{{ invalidLabels?.firstName }}</small>
    <input
      :value="modelValue.lastName"
      :aria-invalid="invalids.lastName"
      @input="onUpdateField('lastName', $event)"
    >
  </fieldset>
</VvFormFieldsGroup>
```

| Slot prop | Type | Meaning |
| --- | --- | --- |
| `modelValue` | object | Values keyed by field name. |
| `invalids` | `Record<string, boolean>` | Per-field invalid flags. |
| `invalidLabels` | `Record<string, string[]>` | Per-field messages. |
| `onUpdateField` | `(name, event\|value) => void` | Write one field back. |

### Custom group component with `:is`

Pass `:is` to render a custom component instead of the slot. With an **array** of
`names`, the component receives a `v-model:<fieldName>` per field plus `invalids` /
`invalidLabels` props:

```vue
<VvFormFieldsGroup :is="MyFieldsGroup" :names="['firstName', 'lastName']" />
```

```vue
<!-- MyFieldsGroup.vue -->
<script setup lang="ts">
defineProps<{ invalids: Record<string, boolean>, invalidLabels?: Record<string, string[]> }>()
const firstName = defineModel<string>('firstName', { default: '' }) // v-model:first-name
const lastName = defineModel<string>('lastName', { default: '' })   // v-model:last-name
</script>
```

To map component v-model names to **different** schema paths, pass `names` as an
**object** `{ vModelName: 'schema.path' }`:

```vue
<VvFormFieldsGroup
  :is="MyCustomComponent"
  :names="{ myComponentVModel: 'path.to.form.field' }"
/>
```
