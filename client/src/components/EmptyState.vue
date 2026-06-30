<template>
  <div
    class="flex flex-col items-center justify-center px-6 py-16 text-center"
  >
    <div
      class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
      :class="iconBg"
    >
      <svg
        class="h-8 w-8"
        :class="iconColor"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          :d="iconPath"
        />
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-[var(--ink)]">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-[var(--ink-3)]">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "inbox" }, // inbox | search | coffee | users
  tone: { type: String, default: "neutral" }, // neutral | brand | good
});

const ICONS = {
  inbox: "M3 8.25A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25v7.5A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-7.5ZM3 12h6.75l1.5 1.5h1.5l1.5-1.5H21",
  search: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
  coffee: "M9 9h6m-6 3h6m-3-6v6m-3.75 6h7.5a3 3 0 0 0 3-3V6.75A3 3 0 0 0 15.75 3.75h-7.5A3 3 0 0 0 5.25 6.75v11.25a3 3 0 0 0 3 3Zm-1.5-9h.008v.008H7.5V9.75Zm12 0h.008v.008H19.5V9.75Z",
  users: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  spark: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z",
};

const iconPath = computed(() => ICONS[props.icon] || ICONS.inbox);
const iconBg = computed(() => {
  if (props.tone === "brand") return "bg-[var(--brand-soft)]";
  if (props.tone === "good") return "bg-emerald-50";
  return "bg-[var(--paper-2)]";
});
const iconColor = computed(() => {
  if (props.tone === "brand") return "text-[var(--brand)]";
  if (props.tone === "good") return "text-emerald-700";
  return "text-[var(--ink-3)]";
});
</script>
