<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

        <!-- Modal card -->
        <div
          class="relative w-full max-w-md rounded-3xl border border-emerald-100 bg-white shadow-[0_32px_96px_rgba(15,23,42,0.18)] overflow-hidden"
        >
          <!-- Top accent bar -->
          <div
            class="h-1.5 w-full bg-linear-to-r from-emerald-400 to-emerald-600"
          />

          <div class="p-8">
            <!-- Icon -->
            <div class="flex justify-center">
              <div
                class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50"
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
            </div>

            <!-- Text -->
            <div class="mt-5 text-center">
              <p
                class="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700"
              >
                Success
              </p>
              <h2 class="mt-2 text-xl font-semibold text-slate-950">
                Access log created
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                {{ message }}
              </p>
            </div>

            <!-- Mobile link -->
            <div
              v-if="shareLink"
              class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Mobile access link
              </p>
              <a
                :href="shareLink"
                target="_blank"
                rel="noreferrer"
                class="mt-2 block break-all text-sm font-medium text-red-800 hover:text-red-700 transition-colors"
              >
                {{ shareLink }}
              </a>

              <!-- QR Code -->
              <div
                class="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start"
              >
                <img
                  :src="qrCodeUrl"
                  alt="Visitor access QR code"
                  class="h-28 w-28 shrink-0 rounded-2xl border border-slate-200 bg-white p-1.5"
                />
                <div class="text-center sm:text-left">
                  <p class="text-sm font-semibold text-slate-700">
                    Scan to open on phone
                  </p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">
                    Point your camera at the QR code to open the visitor page
                    directly. Link expires in 1 hour.
                  </p>
                  <button
                    type="button"
                    @click="copyLink"
                    class="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95"
                  >
                    <svg
                      v-if="!copied"
                      class="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                      />
                    </svg>
                    <svg
                      v-else
                      class="h-3.5 w-3.5 text-emerald-600"
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
                    {{ copied ? "Copied!" : "Copy link" }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                @click="$emit('register-another')"
                class="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
              >
                Register another
              </button>
              <button
                type="button"
                @click="$emit('close')"
                class="flex-1 rounded-3xl bg-red-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
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
import { ref, computed } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: "Visitor log and mobile link created successfully.",
  },
  shareLink: {
    type: String,
    default: "",
  },
});

defineEmits(["close", "register-another"]);

const copied = ref(false);

const qrCodeUrl = computed(() => {
  if (!props.shareLink) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(props.shareLink)}`;
});

const copyLink = async () => {
  if (!props.shareLink) return;
  try {
    await navigator.clipboard.writeText(props.shareLink);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // fallback for older browsers
    const el = document.createElement("textarea");
    el.value = props.shareLink;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.92) translateY(16px);
  opacity: 0;
}
.modal-leave-to .relative {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
