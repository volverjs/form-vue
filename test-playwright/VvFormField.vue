<script setup lang="ts">
	import { useForm } from '../dist/index.es.js'
	import { z } from 'zod'
	import { ref, onMounted, type Ref } from 'vue'

	const zodSchema = z.object({
		firstname: z.string(),
		surname: z.string(),
		location: z.object({
			city: z.string(),
			address: z.string(),
			civicNumber: z.number({ required_error: 'Required error' }).min(1),
			country: z.string(),
			region: z.string(),
		}),
	})

	const { VvForm, VvFormField, VvFormWrapper } = useForm(zodSchema, {
		lazyLoad: true,
	})

	const model: Ref<Zod.infer<typeof zodSchema>> = ref({
		firstname: 'Massimo',
		surname: 'Rossi',
		location: {
			city: 'Verona',
			address: '',
			civicNumber: 0,
			country: '',
			region: '',
		},
	})

	const formEl = ref<InstanceType<typeof VvForm>>()
	onMounted(() => {
		if (formEl.value) {
			formEl.value.submit()
		}
	})
</script>

<template>
	<div>
		<VvForm ref="formEl" v-model="model">
			<VvFormField
				name="firstname"
				type="text"
				label="firstname"
				showValid
			/>
			<VvFormField name="surname" type="text" label="surname" />
			<VvFormWrapper name="location" v-slot="{ invalid }">
				<div class="form-section-1">
					<small v-if="invalid" class="text-danger"
						>There is a validation error</small
					>
					<VvFormField
						name="location.city"
						type="text"
						label="city"
					/>
					<VvFormField
						name="location.address"
						type="text"
						label="address"
					/>
					<VvFormField
						name="location.civicNumber"
						type="number"
						label="civicNumber"
						min="0"
					/>
					<VvFormField
						name="location.country"
						type="text"
						label="country"
					/>
					<VvFormField
						name="location.region"
						type="text"
						label="region"
					/>
				</div>
			</VvFormWrapper>
		</VvForm>
	</div>
</template>
