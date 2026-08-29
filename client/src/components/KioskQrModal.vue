<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-label="Visitor navigation QR"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div
          class="relative w-full max-w-md rounded-3xl border border-[var(--bsu-line)] bg-white shadow-[0_32px_96px_rgba(15,23,42,0.18)] overflow-hidden"
        >
          <div class="h-1.5 w-full bg-gradient-to-r from-[var(--bsu-red-deep)] to-[var(--bsu-red)]" />
          <div class="p-8 text-center">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--bsu-red)]">
              Visitor QR
            </p>
            <h2 class="font-display mt-2 text-xl font-semibold text-slate-950">
              {{ entry?.name || "Visitor" }}
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              Re-show this QR so the visitor can scan and save their visit.
            </p>

            <div
              v-if="entry?.qrToken"
              class="mt-6 rounded-2xl border border-[var(--bsu-line)] bg-[var(--bsu-paper-2)] p-6"
            >
              <VisitorQr
                :value="qrValue"
                alt="Visitor navigation QR code"
              />
              <p class="font-display mt-4 text-base font-bold tabular text-slate-950">
                {{ entry?.office || "Office" }}
              </p>
              <p
                v-if="entry?.reference"
                class="mt-1 font-mono text-sm tabular text-[var(--bsu-ink-2)]"
              >
                Reference {{ entry.reference }}
              </p>
              <p class="mt-1 text-xs text-[var(--bsu-ink-3)]">
                Scan with your phone to save this visit
              </p>
            </div>
            <div
              v-else
              class="mt-6 rounded-2xl border border-dashed border-[var(--bsu-line)] bg-[var(--bsu-paper-2)] p-6 text-xs leading-5 text-[var(--bsu-ink-3)]"
            >
              No QR is available for this registration on this device — it may
              have been logged from another kiosk or the QR window expired.
            </div>

            <div class="mt-6">
              <button
                type="button"
                class="w-full rounded-3xl bg-[var(--bsu-red)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bsu-red-deep)]"
                @click="$emit('close')"
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
import { computed } from "vue";
import VisitorQr from "@/components/VisitorQr.vue";

const props = defineProps({
  show: Boolean,
  entry: { type: Object, default: null },
});

defineEmits(["close"]);

const qrValue = computed(() => {
  const token = props.entry?.qrToken || "";
  if (!token) return "";
  const origin = import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin;
  return `${origin}/status?token=${token}`;
});
</script>