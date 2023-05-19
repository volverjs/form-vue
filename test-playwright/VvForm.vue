<script setup lang="ts">
	import { useForm } from '../dist/index.es.js'
	import { z } from 'zod'
	import { ref, type Ref } from 'vue'

	const props = defineProps(['invalid', 'continuosValidation'])

	defineEmits(['submit', 'invalid', 'valid', 'click'])

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
		age: props.invalid ? 17 : 18,
	})
</script>

<template>
	<div>
		<VvForm
			v-bind="{ continuosValidation }"
			v-model="model"
			@submit="$emit('submit')"
			@invalid="$emit('invalid')"
			@valid="$emit('valid')"
			ref="formEl"
		>
			<VvFormField name="firstname" type="text" label="firstname" />
			<VvFormField name="surname" type="text" label="surname" />
			<VvFormField name="age" type="number" label="age" />

			<button
				type="button"
				title="Submit"
				class="vv-button"
				@click.stop="$emit('click')"
			>
				Click
			</button>

			<button type="submit" class="vv-button" title="Submit">
				Submit
			</button>
		</VvForm>
	</div>
</template>
