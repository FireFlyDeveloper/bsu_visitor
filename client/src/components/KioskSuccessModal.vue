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
          class="relative w-full max-w-md rounded-3xl border border-[var(--bsu-line)] bg-white shadow-[0_32px_96px_rgba(15,23,42,0.18)] overflow-hidden"
        >
          <div
            class="h-1.5 w-full bg-gradient-to-r from-[var(--bsu-red-deep)] to-[var(--bsu-red)]"
          />
          <div class="p-8 text-center">
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bsu-red-soft)] ring-8 ring-[var(--bsu-red-soft)]"
            >
              <svg
                class="h-8 w-8 text-[var(--bsu-red)]"
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
              class="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--bsu-red)]"
            >
              Success
            </p>
            <h2 class="font-display mt-2 text-xl font-semibold text-slate-950">
              {{ visitorName || "Visitor" }} logged
            </h2>
            <p
              v-if="message"
              class="mt-2 text-sm leading-6 text-slate-500"
            >
              {{ message }}
            </p>

            <!-- QR handoff slot -->
            <div
              v-if="showQrSlot && qrValue"
              class="mt-6 rounded-2xl border border-[var(--bsu-line)] bg-[var(--bsu-paper-2)] p-6"
            >
              <VisitorQr
                :value="qrValue"
                alt="Visitor navigation QR code"
              />
              <p
                class="font-display mt-4 text-base font-bold tabular text-slate-950"
              >
                {{ officeName || "Office" }}
              </p>
              <p
                v-if="referenceNumber"
                class="mt-1 font-mono text-sm tabular text-[var(--bsu-ink-2)]"
              >
                Reference {{ referenceNumber }}
              </p>
              <p class="mt-1 text-xs text-[var(--bsu-ink-3)]">
                Scan with your phone to save this visit
              </p>
            </div>

            <div class="mt-6 flex gap-3">
              <button
                type="button"
                @click="$emit('register-another')"
                class="flex-1 rounded-3xl border border-[var(--bsu-line)] bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Register another
              </button>
              <button
                type="button"
                @click="$emit('close')"
                class="flex-1 rounded-3xl bg-[var(--bsu-red)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bsu-red-deep)]"
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
import VisitorQr from "@/components/VisitorQr.vue";

defineProps({
  show: Boolean,
  message: String,
  showQrSlot: { type: Boolean, default: true },
  qrValue: { type: String, default: "" },
  officeName: { type: String, default: "" },
  referenceNumber: { type: String, default: "" },
  visitorName: { type: String, default: "" },
});
defineEmits(["close", "register-another"]);
</script>