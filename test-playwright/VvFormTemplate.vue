<script setup lang="ts">
	import { type FormTemplate, useForm } from '../src'
	import { z } from 'zod'
	import { ref, onMounted, type Ref } from 'vue'
	import ScopedSlot from './components/ScopedSlot.vue'

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

	const { VvForm, VvFormTemplate } = useForm(zodSchema, {
		lazyLoad: true,
	})

	const schema: FormTemplate<typeof zodSchema> = [
		{
			vvName: 'firstname',
			vvShowValid: true,
			vvType: 'text',
			label: 'firstname',
		},
		{
			vvName: 'surname',
			vvType: 'text',
			label: 'surname',
		},
		{
			vvIs: ScopedSlot,
			label: 'city',
			class: 'form-section-1',
			vvChildren: (_, scope) => [
				{
					vvName: 'location.city',
					vvType: 'text',
					label: scope?.label,
				},
				{
					vvName: 'location.address',
					vvType: 'text',
					label: 'address',
				},
				{
					vvName: 'location.civicNumber',
					vvType: 'number',
					label: 'civicNumber',
					min: 0,
				},
				{
					vvName: 'location.country',
					vvType: 'text',
					label: 'country',
				},
				{
					vvName: 'location.region',
					vvType: 'text',
					label: 'region',
				},
			],
		},
	]

	const model: Ref<z.infer<typeof zodSchema>> = ref({
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
	<VvForm ref="formEl" v-model="model">
		<VvFormTemplate :schema="schema" />
	</VvForm>
</template>
