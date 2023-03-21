<script setup lang="ts">
	import { useForm } from '../dist/index.es.js'
	import { z } from 'zod'
	import { ref, type Ref } from 'vue'

	const zodSchema = z.object({
		firstname: z.string(),
		surname: z.string(),
	})

	const { VvForm, VvFormField } = useForm(zodSchema, {
		lazyLoad: true,
	})

	const model: Ref<Zod.infer<typeof zodSchema>> = ref({
		firstname: 'Massimo',
		surname: 'Rossi',
	})
</script>

<template>
	<div>
		<VvForm v-model="model">
			<VvFormField
				name="firstname"
				type="text"
				:props="{ label: 'firstname' }"
			/>
			<VvFormField
				name="surname"
				type="text"
				:props="{ label: 'surname' }"
			/>
		</VvForm>
	</div>
</template>
