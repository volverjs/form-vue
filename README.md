<div align="center">
  
[![volverjs](docs/static/volverjs-auth.svg)](https://volverjs.github.io/form-vue)

## @volverjs/form-vue

`form` `field` `customForm` `customField`

<br>

#### proudly powered by

<br>

[![24/Consulting](docs/static/24consulting.svg)](https://24consulting.it)

<br>

</div>

## Install

# pnpm
pnpm add @volverjs/form-vue

# yarn
yarn add @volverjs/form-vue

# npm
npm install @volverjs/form-vue --save

## Usage

This library provides a composable or a plugin to generate a form, with specific configuration. The form is composed of three components: `VvForm`, `VvFormWrapper`, and `VvFormField`.

```typescript
import { useForm } from '@volverjs/form-vue'
const { VvForm, VvFormWrapper, VvFormField } = useForm({
    // Form configuration
})
```

### VvFormField

The `VvFormField` is a component that allow you to use a specific [`@volverjs/ui-vue`](https://github.com/volverjs/ui-vue) component by pass the prop `type`.

```html
<template>
    <!-- 
        This generate a VvInputText component with the label "Name" and the v-model binded to the name variable.
    -->
    <vv-form-field
        type="text"
        label="Name"
        v-model="name"
    />
</template>
<script setup lang="ts">
import { VvFormField } from '@volverjs/form-vue'

const name = ref('')
</script>
```

It also allow you to use a custom component by pass the prop `type` with the value `custom`. Or the prop `is` with the component.
    
```html
<template>
    <vv-form-field
        type="custom"
        label="Name"
        v-model="name"
    >
        <my-custom-component />
    </vv-form-field>
</template>
<script setup lang="ts">
import { VvFormField } from '@volverjs/form-vue'

const name = ref('')
</script>
```
Please, refer to the [VvFormField documentation](/docs/VvFormField.md) for more information.

### VvFormWrapper

The `VvFormWrapper` is a component that give you the validation status of all the component used inside it.

```html
<template>
    <vv-form-wrapper>
        <template #default="{ invalid }">
            <span v-if="invalid">
                There is a validation error
            </span>
            <vv-form-field
                type="text"
                label="Name"
                v-model="name"
                :error="form.errors.name"
            />
            <vv-form-field
                type="text"
                label="Surname"
                v-model="surname"
                :error="form.errors.surname"
            />
        </template>
    </vv-form-wrapper>
</template>
<script>
import { VvFormWrapper } from '@volverjs/form-vue'
</script>
```

### VvForm

The `VvForm` is a wrapper of the `form` tag. It allow you to use the `VvFormWrapper` and the `VvFormField` components inside it.

### Form configuration
The form configuration is the following:

```typescript
type FormComposableOptions = {
	lazyLoad?: boolean
	updateThrottle?: number
	sideEffects?: (type: `${FormFieldType}`) => Promise | void
}

const schema: AnyZodObject
const options: FormComposableOptions

const { VvForm, VvFormWrapper, VvFormField } = useForm({
    schema,
    options
})
```

Please, refer to the [VvForm documentation](/docs/VvForm.md) for more information about the configuration.

```typescript
import { useForm } from '@volverjs/form-vue'
const { VvForm, VvFormWrapper, VvFormField } = useForm({
    // Form configuration
})
const data = ref({
    name: '',
    surname: ''
})

const onSubmit = (data) => {
    // Do something with the data
}
```
```html
<template>
    <vv-form v-model="data" @submit="onSubmit">
        <vv-form-wrapper>
            <template #default="{ invalid }">
                <span v-if="invalid">
                    There is a validation error
                </span>
                <vv-form-field
                    type="text"
                    label="Name"
                    v-model="name"
                    :error="form.errors.name"
                />
                <vv-form-field
                    type="text"
                    label="Surname"
                    v-model="surname"
                    :error="form.errors.surname"
                />
            </template>
        </vv-form-wrapper>
    </vv-form>
</template>
```

## VueJS - Plugin
If you are using VueJS, you can use the `@volverjs/form-vue` plugin to register globally the form components and the form options.

### Install

```typescript
import { createApp } from 'vue'
import createForm from '@volverjs/form-vue'

const app = createApp(App)
const form = createForm({
    schema,
    options
})

app.use(form)
app.mount('#app')
```

## License

[MIT](http://opensource.org/licenses/MIT)