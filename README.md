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

`@volverjs/form-vue` allow you to create a Vue 3 form with [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) components from a [Zod Object](https://zod.dev/?id=objects) schema. It provides three functions: `createForm`, `useForm` and `formFactory`.

## Plugin

`createForm` defines globally three components `VvForm`, `VvFormWrapper`, and `VvFormField` through a [Vue 3 Plugin](https://vuejs.org/guide/reusability/plugins.html).

```typescript
import { createApp } from 'vue'
import { createForm } from '@volverjs/form-vue'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  surname: z.string()
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

By default [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) components must be defined globally but can be lazy loaded with `lazyLoad` option. If the schema is omitted, the plugin only share the options to the forms created with the [composable](https://github.com/volverjs/form-vue/#composable).

### VvForm

`VvForm` render a `form` tag and emit a `submit` event. Form data are validated on submit.
A `valid` or `invalid` event is emitted when the form status changes.

```vue
<script lang="ts" setup>
  const onSubmit = (formData) => {
    // Do something with the form data
  }
  const onInvalid = (errors) => {
    // Do something with the errors
  }
</script>

<template>
  <VvForm @submit="onSubmit" @invalid="onInvalid">
    <!-- form fields -->
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
    // Do something with the form data
  }
  const submitForm = () => {
    formEl.value.submit()
  }
</script>

<template>
  <VvForm @submit="onSubmit" ref="formEl">
    <!-- form fields -->
  </VvForm>
  <button type="button" @click.stop="submitForm">Submit</button>
</template>
```

Use the `v-model` directive (or only `:model-value` to set the initial value of form data) to bind the form data.
The form data two way binding is throttled by default (500ms) to avoid performance issues.
The throttle can be changed with the `updateThrottle` option.

```vue
<script lang="ts" setup>
  import { ref } from 'vue'

  const formData = ref({
    name: '',
    surname: ''
  })
</script>

<template>
  <VvForm v-model="formData">
    <!-- form fields -->
  </VvForm>
</template>
```

The `continuosValidation` can be passed through options or with VvForm prop.
With this field the validation doesn't stop and continue also after a validaton success.

```vue
<script lang="ts" setup>
  import { ref } from 'vue'

  const { VvForm, VvFormField } = useForm(MyZodSchema, {
    lazyLoad: true
    // continuosValidation: true
  })

  const formData = ref({
    name: '',
    surname: ''
  })
</script>

<template>
  <VvForm v-model="formData" :continuosValidation="true">
    <!-- form fields -->
  </VvForm>
</template>
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

`VvFormWrapper` can be used recursively to create a validation tree. The wrapper status is invalid if at least one of the fields inside it or one of its children is invalid.

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

`VvFormField` allow you to render a [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) input component inside a form. It automatically bind the form data through the `name` attribute.

```vue
<template>
  <VvForm>
    <VvFormField type="text" name="name" label="Name" />
    <VvFormField type="text" name="surname" label="Surname" />
  </VvForm>
</template>
```

For nested objects, use the `name` attribute with dot notation.

```vue
<template>
  <VvForm>
    <VvFormField type="text" name="shipping.address" label="Shipping address" />
  </VvForm>
</template>
```

The type of input component is defined by the `type` attribute.
All the available input types are listed in the [VvFormField documentation](/docs/VvFormField.md).

You can also use the `VvFormField` component to render a default slot without a `type` (default `type` is `custom`).

```vue
<template>
  <VvForm>
    <VvFormField
      v-slot="{
        modelValue,
        invalid,
        invalidLabel,
        formData,
        formErrors,
        errors,
        onUpdate
      }"
      name="surname"
    >
      <label for="surname">Surname</label>
      <input
        id="surname"
        type="text"
        :value="modelValue"
        :aria-invalid="invalid"
        :aria-errormessage="invalid ? 'surname-alert' : undefined"
        @input="onUpdate"
      />
      <small v-if="invalid" role="alert" id="surname-alert">
        {{ invalidLabel }}
      </small>
    </VvFormField>
  </VvForm>
</template>
```

Or a custom component.

```vue
<script lang="ts" setup>
  import MyInput from './MyInput.vue'
</script>

<template>
  <VvForm>
    <VvFormField name="surname" :is="MyInput" />
  </VvForm>
</template>
```

## Nested VvFormField

In some use cases can be usefull nest `VvFormField`.
For example let's assume:

- a shopping list that is a field of our model (ex: ToDo list)
- the sum of all products of the shopping list cannot be 0
- we don't know all the products a priori

So our ToDo model and shopping list are structured like:

```javascript
const toDo = {
  shoppingList: {
    bread: 0,
    milk: 0,
    tomato: 0,
    potato: 0,
    ...
  }
}
```

Our Zod schema can be:

```typescript
const toDoSchema = z.object({
  shoppingList: z
    .object({})
    .default({})
    .superRefine((value, ctx) => {
      const shoppingList = value as Record<string, number>
      if (
        Object.keys(value).length &&
        !Object.keys(value).find((key) => shoppingList[key] > 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.global.t('atLeastOneProduct')
        })
      }
    })
})
```

And the Vue component:

```vue
<script setup lang="ts">
  const { VvForm, VvFormField } = useForm(toDoSchema, {
    lazyLoad: true,
    continuosValidation: true
  })

  // shopping list data, const or async
  const shoppingList = {
    bread: 0,
    milk: 0,
    tomato: 0,
    potato: 0
  }
</script>

<template>
  <VvForm>
    <VvFormField v-slot="{ invalid, invalidLabel }" name="shoppingList">
      <VvFormField
        v-for="key in Object.keys(shoppingList)"
        :key="key"
        :name="`shoppingList.${key}`"
        :label="$t(key)"
      />
      <small v-if="invalid" class="input-counter__hint">{{
        invalidLabel[0]
      }}</small>
    </VvFormField>
  </VvForm>
</template>
```

## Composable

`useForm` can be used to create a form programmatically inside a Vue 3 Component.
The default settings are inherited from the plugin (if it was defined).

```vue
<script lang="ts" setup>
  import { useForm } from '@volverjs/form-vue'
  import { z } from 'zod'

  const schema = z.object({
    name: z.string(),
    surname: z.string()
  })

  const { VvForm, VvFormWrapper, VvFormField } = useForm(schema, {
    // lazyLoad: boolean - default false
    // updateThrottle: number - default 500
    // continuosValidation: true - default false
    // sideEffects?: (formData: any) => void
  })
</script>

<template>
  <VvForm>
    <VvFormField type="text" name="name" label="Name" />
    <VvFormField type="text" name="surname" label="Surname" />
  </VvForm>
</template>
```

## Outside a Vue 3 Component

`formFactory` can be used to create a form outside a Vue 3 Component.
No settings are inherited.

```ts
import { formFactory } from '@volverjs/form-vue'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  surname: z.string()
})

const { VvForm, VvFormWrapper, VvFormField } = formFactory(schema, {
  // lazyLoad: boolean - default false
  // updateThrottle: number - default 500
  // continuosValidation: true - default false
  // sideEffects?: (data: any) => void
})

export default { VvForm, VvFormWrapper, VvFormField }
```

## Default Object by Zod Object Schema

`defaultObjectBySchema` creates an object by a Zod Object Schema.
It can be useful to create a default object for a form. The default object is created by the default values of the schema and can be merged with an other object passed as parameter.

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
