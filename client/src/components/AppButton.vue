<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['btn', `btn-${variant}`, size !== 'md' ? `btn-${size}` : '', block ? 'btn-block' : '']"
  >
    <span
      v-if="loading"
      class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden="true"
    />
    <slot v-else name="icon" />
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: "button" },
  variant: {
    type: String,
    default: "primary",
    validator: (v) =>
      ["primary", "secondary", "ghost", "danger", "success"].includes(v),
  },
  size: { type: String, default: "md" },
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});
</script>
