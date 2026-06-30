<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-lg"
          :class="toneClass(t.type)"
        >
          <span
            class="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
            :class="dotClass(t.type)"
          />
          <p class="flex-1 text-sm text-[var(--ink)]">{{ t.message }}</p>
          <button
            class="text-[var(--ink-3)] hover:text-[var(--ink)]"
            @click="dismiss(t.id)"
            aria-label="Dismiss"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from "@/composables/useToast";

const { toasts, dismiss } = useToast();

function toneClass(type) {
  return {
    success: "border-emerald-200",
    error: "border-rose-200",
    warn: "border-amber-200",
    info: "border-[var(--line)]",
  }[type] || "border-[var(--line)]";
}
function dotClass(type) {
  return {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    warn: "bg-amber-500",
    info: "bg-slate-500",
  }[type] || "bg-slate-500";
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
