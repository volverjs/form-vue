<script setup lang="ts">
	import { useForm } from '../src'
	import { z } from 'zod'
	import { ref, type Ref } from 'vue'

	defineProps({
		continuousValidation: Boolean,
	})
	defineEmits(['submit', 'invalid', 'valid'])

	const zodSchema = z.object({
		firstname: z.string(),
		surname: z.string(),
		age: z.number().min(18),
	})

	const { VvForm, VvFormField } = useForm(zodSchema, {
		lazyLoad: true,
	})

	const model: Ref<z.infer<typeof zodSchema>> = ref({
		firstname: 'Massimo',
		surname: 'Rossi',
		age: 18,
	})
</script>

<template>
	<VvForm
		ref="formEl"
		v-bind="{ continuousValidation }"
		v-model="model"
		@submit="$emit('submit')"
		@invalid="$emit('invalid')"
		@valid="$emit('valid')"
	>
		<VvFormField name="firstname" type="text" label="firstname" />
		<VvFormField name="surname" type="text" label="surname" />
		<VvFormField name="age" type="number" label="age" />
		<button type="submit" class="vv-button" title="Submit">Submit</button>
	</VvForm>
</template>
