<script setup lang="ts">
import * as z from 'zod/v4'
import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useForm } from '../src'
import NameSurname from './components/NameSurname.vue'

defineEmits(['submit', 'invalid', 'valid', 'reset'])

const zodSchema = z.object({
    firstname: z.string().min(3),
    lastname: z.string().min(3),
})

const { VvForm, VvFormFieldsGroup } = useForm(zodSchema, {
    lazyLoad: true,
})

const model: Ref<z.infer<typeof zodSchema>> = ref({
    firstname: '',
    lastname: '',
})

const formEl = ref<InstanceType<typeof VvForm>>()
onMounted(() => {
    if (formEl.value) {
        formEl.value.submit()
    }
})
</script>

<template>
    <VvForm
        ref="formEl"
        v-model="model"
        @submit="$emit('submit', $event)"
        @invalid="$emit('invalid')"
        @valid="$emit('valid')"
    >
        <VvFormFieldsGroup
            :is="NameSurname" :names="{
                name: 'firstname',
                surname: 'lastname',
            }"
        />
        <button type="submit" class="vv-button" title="Submit">
            Submit
        </button>
    </VvForm>
</template>
