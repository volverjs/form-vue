<script setup lang="ts">
	defineProps<{
		label: string
	}>()
</script>

<template>
	<div>
		<slot v-bind="{ label }"></slot>
	</div>
</template>
