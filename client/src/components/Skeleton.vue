<template>
  <div
    class="skeleton"
    :class="classes"
    :style="{
      width: typeof width === 'number' ? width + 'px' : width,
      height: typeof height === 'number' ? height + 'px' : height,
      borderRadius: rounded ? '9999px' : undefined,
    }"
  />
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  width: { type: [String, Number], default: "100%" },
  height: { type: [String, Number], default: 16 },
  rounded: { type: Boolean, default: false },
  variant: { type: String, default: "line" }, // line | block | circle
});

const classes = computed(() => {
  if (props.variant === "circle") return "rounded-full aspect-square";
  if (props.variant === "block") return "";
  return "";
});
</script>
