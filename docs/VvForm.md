# VvForm

## Usage passing the schema

```typescript
import { useForm } from '@volverjs/form-vue'
const schema = z.object({
  name: z.string(),
  surname: z.string()
})
const { VvForm, VvFormWrapper, VvFormField } = useForm({
  schema
})

const onSubmit = (data) => {
    /**
     * data = {
     *  name: 'John',
     * surname: 'Doe'
     * }
     */
}
```
    
```html
<template>
  <vv-form @submit="onSubmit">
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
    <VvButton type="submit">Submit</VvButton>
  </vv-form>
</template>
```

The submit event is emitted when the form is submitted by adding a button of type submit, like in the example, or by triggering the  submit method using the ref.

```html
<template>
  <vv-form ref="form">
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
    <VvButton @click="submit">Submit</VvButton>
  </vv-form>
</template>
<script setup>
const form = ref(null)
const submit = () => {
    form.value.submit()
}
return {
    form,
    submit
}
</script>
```

*The `VvButton` component is not part of the `form-vue` package. Please refer to the [Volver UI Vue](https://github.com/volverjs/ui-vue)


## Options structure


```typescript
export type FormComposableOptions = {
	lazyLoad?: boolean
	updateThrottle?: number
	sideEffects?: (type: `${FormFieldType}`) => Promise | void
}

enum FormFieldType {
	text = 'text',
	number = 'number',
	email = 'email',
	password = 'password',
	tel = 'tel',
	url = 'url',
	search = 'search',
	date = 'date',
	time = 'time',
	datetimeLocal = 'datetimeLocal',
	month = 'month',
	week = 'week',
	color = 'color',
	select = 'select',
	checkbox = 'checkbox',
	radio = 'radio',
	textarea = 'textarea',
	radioGroup = 'radioGroup',
	checkboxGroup = 'checkboxGroup',
	combobox = 'combobox',
	custom = 'custom',
}
```