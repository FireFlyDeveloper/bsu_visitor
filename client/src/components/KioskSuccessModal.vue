<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div
          class="relative w-full max-w-md rounded-3xl border border-emerald-100 bg-white shadow-[0_32px_96px_rgba(15,23,42,0.18)] overflow-hidden"
        >
          <div
            class="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
          <div class="p-8 text-center">
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50"
            >
              <svg
                class="h-8 w-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <p
              class="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700"
            >
              Success
            </p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">
              Visitor logged
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              {{ message || "Visitor has been queued for the destination office." }}
            </p>

            <!-- QR placeholder (to be implemented later) -->
            <div
              v-if="showQrSlot"
              class="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-xs text-slate-400"
            >
              QR slot — reserved for navigation QR
            </div>

            <div class="mt-6 flex gap-3">
              <button
                type="button"
                @click="$emit('register-another')"
                class="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Register another
              </button>
              <button
                type="button"
                @click="$emit('close')"
                class="flex-1 rounded-3xl bg-red-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: Boolean,
  message: String,
  showQrSlot: { type: Boolean, default: true },
});
defineEmits(["close", "register-another"]);
</script>
