[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=volverjs_form-vue&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=volverjs_form-vue) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=volverjs_form-vue&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=volverjs_form-vue) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=volverjs_form-vue&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=volverjs_form-vue) [![Depfu](https://badges.depfu.com/badges/e2c464e3cb95f98ee6a9a566dd44e0a9/status.svg)](https://depfu.com) [![Depfu](https://badges.depfu.com/badges/e2c464e3cb95f98ee6a9a566dd44e0a9/overview.svg)](https://depfu.com/github/volverjs/form-vue?project_id=38569)

<div align="center">
  
[![volverjs](docs/static/volverjs-form.svg)](https://volverjs.github.io/form-vue)

## @volverjs/form-vue

`form` `form-field` `form-wrapper` `vue3` `zod` `validation`

<br>

#### proudly powered by

<br>

[![24/Consulting](docs/static/24consulting.svg)](https://24consulting.it)

<br>

</div>

## Install

```bash
# pnpm
pnpm add @volverjs/form-vue

# yarn
yarn add @volverjs/form-vue

# npm
npm install @volverjs/form-vue --save
```

## Usage

`@volverjs/form-vue` allow you to create a Vue 3 form with [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) components from a [Zod Object](https://zod.dev/?id=objects) schema. It provides two functions: `createForm()` and `useForm()`.

## Plugin

`createForm()` defines globally three components `VvForm`, `VvFormWrapper`, and `VvFormField` through a [Vue 3 Plugin](https://vuejs.org/guide/reusability/plugins.html).

```typescript
import { createApp } from 'vue'
import { createForm } from '@volverjs/form-vue'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string(),
  lastName: z.string()
})

const app = createApp(App)
const form = createForm({
  schema
  // lazyLoad: boolean - default false
  // updateThrottle: number - default 500
  // continuosValidation: boolean - default false
  // sideEffects?: (data: any) => void
})

app.use(form)
app.mount('#app')
```

If the schema is omitted, the plugin only share the options to the forms created with the [composable](https://github.com/volverjs/form-vue/#composable).

### VvForm

`VvForm` render a `form` tag and emit a `submit` event. Form data are validated on submit.
A `valid` or `invalid` event is emitted when the form status changes.

```vue
<script lang="ts" setup>
  const onSubmit = (formData) => {
    // ...
  }
  const onInvalid = (errors) => {
    // ...
  }
</script>

<template>
  <VvForm @submit="onSubmit" @invalid="onInvalid">
    <!-- ... -->
    <button type="submit">Submit</button>
  </VvForm>
</template>
```

The submit can be triggered programmatically with the `submit()` method.

```vue
<script lang="ts" setup>
  import { ref } from 'vue'
  import type { FormComponent } from '@volverjs/form-vue'

  const formEl = ref<InstanceType<FormComponent>>(null)
  const onSubmit = (formData) => {
    // ...
  }
  const submitForm = () => {
    formEl.value.submit()
  }
</script>

<template>
  <VvForm @submit="onSubmit" ref="formEl">
    <!-- ... -->
  </VvForm>
  <button type="button" @click.stop="submitForm">Submit</button>
</template>
```

Use the `v-model` directive (or only `:model-value` to set the initial value of form data) or bind the form data.

The form data two way binding is **throttled** by default (500ms) to avoid performance issues. The throttle can be changed with the `updateThrottle` option or prop.

By default form validation **stops** when a **valid state** is reached.
To activate **continuos validation** use the `continuosValidation` option or prop.

```vue
<script lang="ts" setup>
  import { ref } from 'vue'

  const formData = ref({
    firstName: '',
    lastName: ''
  })
</script>

<template>
  <VvForm v-model="formData" :update-throttle="1000" continuos-validation>
    <!-- ... -->
  </VvForm>
</template>
```

## Composable

`useForm()` can be used to create a form programmatically inside a Vue 3 Component.
The **default settings** are **inherited** from the plugin (if it's installed).

```vue
<script lang="ts" setup>
  import { useForm } from '@volverjs/form-vue'
  import { z } from 'zod'

  const schema = z.object({
    firstName: z.string(),
    lastName: z.string()
  })

  const { VvForm, VvFormWrapper, VvFormField } = useForm(schema, {
    // lazyLoad: boolean - default false
    // updateThrottle: number - default 500
    // continuosValidation: boolean - default false
    // sideEffects?: (formData: any) => void
  })
</script>

<template>
  <VvForm>
    <VvFormField type="text" name="firstName" label="First Name" />
    <VvFormField type="text" name="lastName" label="Last Name" />
  </VvForm>
</template>
```

### Outside a Vue 3 Component

`useForm()` can create a form also outside a Vue 3 Component, plugin settings are **not inherited**.

```ts
import { useForm } from '@volverjs/form-vue'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  surname: z.string()
})

const {
  VvForm,
  VvFormWrapper,
  VvFormField,
  VvFormTemplate,
  formData,
  status,
  errors
} = useForm(schema, {
  lazyLoad: true
})

export default {
  VvForm,
  VvFormWrapper,
  VvFormField,
  VvFormTemplate,
  formData,
  status,
  errors
}
```

### VvFormWrapper

`VvFormWrapper` gives you the validation status of a part of your form.
The wrapper status is invalid if at least one of the fields inside it is invalid.

```vue
<template>
  <VvForm>
    <VvFormWrapper v-slot="{ invalid }">
      <div class="form-section-1">
        <span v-if="invalid">There is a validation error</span>
        <!-- form fields of section 1 -->
      </div>
    </VvFormWrapper>
    <VvFormWrapper v-slot="{ invalid }">
      <div class="form-section-2">
        <span v-if="invalid">There is a validation error</span>
        <!-- form fields of the section 2 -->
      </div>
    </VvFormWrapper>
  </VvForm>
</template>
```

`VvFormWrapper` can be used recursively to create a validation tree. The wrapper status is invalid if **at least one of the fields** inside it or one of its children **is invalid**.

```vue
<template>
  <VvForm>
    <VvFormWrapper v-slot="{ invalid }">
      <div class="form-section">
        <span v-if="invalid">There is a validation error</span>
        <!-- form fields of section -->
        <VvFormWrapper v-slot="{ invalid: groupInvalid }">
          <div class="form-section__group">
            <span v-if="groupInvalid">There is a validation error</span>
            <!-- form fields of the group -->
          </div>
        </VvFormWrapper>
      </div>
    </VvFormWrapper>
  </VvForm>
</template>
```

### VvFormField

`VvFormField` allow you to render a form field or a [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) input component inside a form.

It automatically bind the form data through the `name` attribute. For nested objects, use the `name` attribute with **dot notation**.

```vue
<template>
  <VvForm>
    <VvFormField
      v-slot="{ modelValue, invalid, invalidLabel, onUpdate }"
      name="lastName"
    >
      <label for="lastName">Last Name</label>
      <input
        id="lastName"
        type="text"
        name="lastName"
        :value="modelValue"
        :aria-invalid="invalid"
        :aria-errormessage="invalid ? 'last-name-alert' : undefined"
        @input="onUpdate"
      />
      <small v-if="invalid" role="alert" id="last-name-alert">
        {{ invalidLabel }}
      </small>
    </VvFormField>
  </VvForm>
</template>
```

To render a [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) input component, use the `type` attribute.
By default UI components must be installed globally, they can be lazy-loaded with `lazyLoad` option or prop.

```vue
<template>
  <VvForm>
    <VvFormField type="text" name="username" label="Username" lazy-load />
    <VvFormField type="password" name="password" label="Password" lazy-load />
  </VvForm>
</template>
```

Check the [`VvFormField` documentation](./docs/VvFormField.md) to learn more about form fields.

## VvFormTemplate

Forms can also be created using a template. A template is an **array of objects** that describes the form fields. All properties that are **not listed** below are passed to the component **as props**.

```vue
<script lang="ts" setup>
  import { useForm } from '@volverjs/form-vue'
  import { z } from 'zod'

  const schema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    address: z.object({
      street: z.string(),
      number: z.string(),
      city: z.string(),
      zip: z.number()
    })
  })

  const templateSchema = [
    {
      vvName: 'firstName',
      vvType: 'text',
      label: 'First Name'
    },
    {
      vvName: 'lastName',
      vvType: 'text',
      label: 'Last Name'
    },
    {
      vvIs: 'div',
      class: 'grid grid-col-3 gap-4',
      vvChildren: [
        {
          vvName: 'address.street',
          vvType: 'text',
          label: 'Street',
          class: 'col-span-2'
        },
        {
          vvName: 'address.number',
          vvType: 'text',
          label: 'Number'
        },
        {
          vvName: 'address.city',
          vvType: 'text',
          label: 'City'
          class: 'col-span-2',
        },
        {
          vvName: 'address.zip',
          vvType: 'number',
          label: 'Zip'
        }
      ]
    }
  ]

  const { VvForm, VvFormTemplate } = useForm(schema)
</script>

<template>
  <VvForm>
    <VvFormTemplate :schema="templateSchema" />
  </VvForm>
</template>
```

Template items, by default, are rendered as a `VvFormField` component but this can be changed using the `vvIs` property. The `vvIs` property can be a string or a component.

`vvName` refers to the name of the field in the schema and can be a nested property using **dot notation**.
`vvType` refers to the type of the field and can be any of the supported [types](./docs/VvFormField.md#ui-components).
`vvDefaultValue` can be used to set default values for the form item.
`vvShowValid` can be used to show the valid state of the form item.
`vvSlots` can be used to pass a slots to the template item.
`vvChildren` is an array of template items which will be wrapped in the parent item.

Conditional rendering can be achieved using the `vvIf` and `vvElseIf` properties.

```vue
<script lang="ts" setup>
  import { useForm } from '@volverjs/form-vue'
  import { z } from 'zod'

  const schema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    hasUsername: z.boolean(),
    username: z.string().optional()
    email: z.string().email().optional()
  }).superRefine((value, ctx) => {
    if (value.hasUsername && !value.username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username is required'
      })
    }
    if (!value.hasUsername && !value.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email is required'
      })
    }
  })

  const templateSchema = [
    {
      vvName: 'firstName',
      vvType: 'text',
      label: 'First Name'
    },
    {
      vvName: 'lastName',
      vvType: 'text',
      label: 'Last Name'
    },
    {
      vvName: 'hasUsername',
      vvType: 'checkbox',
      label: 'Has Username'
      value: true,
      uncheckedValue: false
    },
    {
      vvIf: 'hasUsername',
      vvName: 'username',
      vvType: 'text',
      label: 'Username'
    },
    {
      vvElseIf: true,
      vvName: 'email',
      vvType: 'email',
      label: 'Email'
    }
  ]

  const { VvForm, VvFormTemplate } = useForm(schema)
</script>

<template>
  <VvForm>
    <VvFormTemplate :schema="templateSchema" />
  </VvForm>
</template>
```

`vvElseIf` can be used multiple times. `vvElseIf: true` is like an `else` statement and will be rendered if all previous `vvIf` and `vvElseIf` conditions are false.

`vvIf` and `vvElseIf` can be a string or a function. If it is a string it will be evaluated as a **property** of the form data. If it is a function it will be called with the **form context** as the **first argument** and must return a boolean.

```ts
{
  vvIf: (ctx) => ctx.formData.value.hasUsername,
  vvName: 'username',
  vvType: 'text',
  label: 'Username'
}
```

Also the template schema and all template items can be a function.
The function will be called with the **form context** as the **first argument**.

```ts
const templateSchema = (ctx) => [
  {
    vvName: 'firstName',
    vvType: 'text',
    label: `Hi ${ctx.formData.value.firstName}!`
  }
]
```

```ts
const templateSchema = [
  (ctx) => ({
    vvName: 'firstName',
    vvType: 'text',
    label: `Hi ${ctx.formData.value.firstName}!`
  }),
  {
    vvName: 'username',
    type: 'text',
    label: 'username'
  }
]
```

## Default Object by Zod Object Schema

`defaultObjectBySchema` creates an object by a [Zod Object Schema](https://zod.dev/?id=objects).
It can be useful to create a **default object** for a **form**. The default object is created by the default values of the schema and can be merged with an other object passed as parameter.

```ts
import { z } from 'zod'
import { defaultObjectBySchema } from '@volverjs/form-vue'

const schema = z.object({
  name: z.string().default('John'),
  surname: z.string().default('Doe')
})

const defaultObject = defaultObjectBySchema(schema)
// defaultObject = { name: 'John', surname: 'Doe' }

const defaultObject = defaultObjectBySchema(schema, { name: 'Jane' })
// defaultObject = { name: 'Jane', surname: 'Doe' }
```

`defaultObjectBySchema` can be used with nested objects.

```ts
import { z } from 'zod'
import { defaultObjectBySchema } from '@volverjs/form-vue'

const schema = z.object({
  name: z.string().default('John'),
  surname: z.string().default('Doe'),
  address: z.object({
    street: z.string().default('Main Street'),
    number: z.number().default(1)
  })
})

const defaultObject = defaultObjectBySchema(schema)
// defaultObject = { name: 'John', surname: 'Doe', address: { street: 'Main Street', number: 1 } }
```

Other Zod methods are also supported: [`z.nullable()`](https://github.com/colinhacks/zod#nullable), [`z.coerce`](https://github.com/colinhacks/zod#coercion-for-primitives) and [`z.passthrough()`](https://github.com/colinhacks/zod#passthrough).

```ts
import { z } from 'zod'
import { defaultObjectBySchema } from '@volverjs/form-vue'

const schema = z
  .object({
    name: z.string().default('John'),
    surname: z.string().default('Doe'),
    address: z.object({
      street: z.string().default('Main Street'),
      number: z.number().default(1)
    }),
    age: z.number().nullable().default(null),
    height: z.coerce.number().default(1.8),
    weight: z.number().default(80)
  })
  .passthrough()

const defaultObject = defaultObjectBySchema(schema, {
  height: '1.9',
  email: 'john.doe@test.com'
})
// defaultObject = { name: 'John', surname: 'Doe', address: { street: 'Main Street', number: 1 }, age: null, height: 1.9, weight: 80, email: 'john.doe@test.com' }
```

## License

[MIT](http://opensource.org/licenses/MIT)
