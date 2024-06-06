# VvFormField

`VvFormField` allow you to render a form field or a [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) input component inside a form.

## Template

By default, `VvFormField` renders templates passed through the default slot.

```vue
<script setup lang="ts">
import { useForm } from '@volverjs/form-vue'
import { z } from 'zod'

const schema = z.object({
    username: z.string().min(3)
})

const { VvForm, VvFormField } = useForm(schema)
</script>

<template>
    <VvForm>
        <VvFormField
            v-slot="{
                // field model value
                modelValue,
                // field update function
                onUpdate,
                // field is invalid
                invalid,
                // field validation errors (string[])
                invalidLabel,
                /*** other available scopes
                // field errors
                errors,
                // form data
                formData,
                // form errors
                formErrors,
                */
            }"
            name="username"
        >
            <label for="username">Username</label>
            <input
                id="username"
                type="text"
                :value="modelValue"
                :aria-invalid="invalid"
                :aria-errormessage="invalid ? 'username-alert' : undefined"
                @input="onUpdate"
            >
            <small v-if="invalid" id="username-alert" role="alert">
                {{ invalidLabel }}
            </small>
        </VvFormField>
    </VvForm>
</template>
```

## Custom Components

Field templates can be rendered using custom components.

```vue
<script setup lang="ts">
/* MyInput.vue */
import { defineProps, type PropType } from 'vue'

defineProps({
    name: {
        type: String,
        required: true
    },
    modelValue: {
        type: String,
        required: true
    },
    invalid: {
        type: Boolean,
        default: false
    },
    valid: {
        type: Boolean,
        default: false
    },
    invalidLabel: {
        type: Array as PropType<string[]>,
        default: () => []
    }
})
const emit = defineEmits(['update:modelValue'])
const onUpdate = (newValue: string) => emit('update:modelValue', newValue)
</script>

<template>
    <label for="username">Username</label>
    <input
        id="username"
        type="text"
        :name="name"
        :value="modelValue"
        :aria-invalid="invalid"
        :aria-errormessage="invalid ? 'username-alert' : undefined"
        @input="onUpdate"
    >
    <small v-if="invalid" id="username-alert" role="alert">
        {{ invalidLabel }}
    </small>
</template>
```

Using the `is` prop.

```vue
<script setup lang="ts">
import { useForm } from '@volverjs/form-vue'
import { z } from 'zod'
import MyInput from './MyInput.vue'

const schema = z.object({
    username: z.string().min(3)
})

const { VvForm, VvFormField } = useForm(schema)
</script>

<template>
    <VvForm>
        <VvFormField :is="MyInput" name="username" />
    </VvForm>
</template>
```

## UI Components

### `VvInputText`

The following types are rendered as [`VvInputText`](https://volverjs.github.io/ui-vue/?path=/docs/components-inputtext--docs):

- `text`;
- `number`;
- `email`;
- `password`;
- `tel`;
- `url`;
- `search`;
- `date`;
- `time`;
- `datetime-local`;
- `month`;
- `week`;
- `color`.

### `VvSelect`

The `select` type is rendered as [`VvSelect`](https://volverjs.github.io/ui-vue/?path=/docs/components-select--docs).

### `VvCheckbox`

The `checkbox` type is rendered as [`VvCheckbox`](https://volverjs.github.io/ui-vue/?path=/docs/components-checkbox--docs).

### `VvCheckboxGroup`

The `checkboxGroup` type is rendered as [`VvCheckboxGroup`](https://volverjs.github.io/ui-vue/?path=/docs/components-checkboxgroup--docs).

### `VvRadio`

The `radio` type is rendered as [`VvRadio`](https://volverjs.github.io/ui-vue/?path=/docs/components-radio--docs).

### `VvRadioGroup`

The `radioGroup` type is rendered as [`VvRadioGroup`](https://volverjs.github.io/ui-vue/?path=/docs/components-radiogroup--docs).

### `VvTextarea`

The `textarea` type is rendered as [`VvTextarea`](https://volverjs.github.io/ui-vue/?path=/docs/components-textarea--docs).

### `VvCombobox`

The `combobox` type is rendered as [`VvCombobox`](https://volverjs.github.io/ui-vue/?path=/docs/components-combobox--docs).

## Events

`VvFormField` emits the following events: `invalid`, `valid` and `update:modelValue`.

```vue
<template>
    <VvForm>
        <VvFormField
            name="username"
            @invalid="onInvalid"
            @valid="onValid"
            @update:model-value="onUpdate"
        />
    </VvForm>
</template>
```

## Nested VvFormField

`VvFormField` can also be nested to handle some kind of group validation.

```vue
<script setup lang="ts">
import { useForm } from '@volverjs/form-vue'
import { z } from 'zod'

const schema = z.object({
    shoppingList: z
        .object({
            bread: z.number().int().positive().default(0),
            milk: z.number().int().positive().default(0),
            tomato: z.number().int().positive().default(0),
            potato: z.number().int().positive().default(0)
        })
        .default({})
        .superRefine((value, ctx) => {
            const shoppingList = value as Record<string, number>
            if (
                Object.keys(value).length
                && !Object.keys(value).find(key => shoppingList[key] > 0)
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'At least one item is required'
                })
            }
        })
})

const { VvForm, VvFormField } = useForm(schema)
</script>

<template>
    <VvForm>
        <VvFormField v-slot="{ invalid, invalidLabel }" name="shoppingList">
            <VvFormField
                v-for="key in ['bread', 'milk', 'tomato', 'potato']"
                :key="key"
                type="number"
                :name="`shoppingList.${key}`"
                :label="`Number of ${key}`"
            />
            <template v-if="invalid">
                <small v-for="(hint, index) in invalidLabel" :key="index" class="input-counter__hint">
                    {{ hint }}
                </small>
            </template>
        </VvFormField>
    </VvForm>
</template>
```
