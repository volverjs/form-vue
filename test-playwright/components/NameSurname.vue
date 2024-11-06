<script setup lang="ts">
const name = defineModel<string>('name', { default: '' })
const surname = defineModel<string>('surname', { default: '' })
</script>

<template>
    <div>
        <input v-model="name" name="name" type="text">
        <input v-model="surname" name="surname" type="text">
    </div>
</template>
