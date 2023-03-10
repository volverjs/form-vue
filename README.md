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
        erros,
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
  // sideEffects?: (data: any) => void
})

export default { VvForm, VvFormWrapper, VvFormField }
```

## License

[MIT](http://opensource.org/licenses/MIT)
