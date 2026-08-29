<template>
  <figure class="flex flex-col items-center">
    <div
      class="rounded-2xl border border-[var(--bsu-line)] bg-white p-3 shadow-sm"
    >
      <img
        v-if="qrDataUrl"
        :src="qrDataUrl"
        :alt="alt"
        class="block h-44 w-44 rounded-lg"
        width="176"
        height="176"
        loading="lazy"
      />
      <div
        v-else
        class="flex h-44 w-44 items-center justify-center rounded-lg bg-[var(--bsu-paper-2)] text-xs text-[var(--bsu-ink-3)]"
        role="status"
        aria-live="polite"
      >
        {{
          renderError
            ? "Couldn't generate this QR"
            : "Generating QR…"
        }}
      </div>
    </div>
    <figcaption
      v-if="caption"
      class="mt-2 max-w-[13rem] text-center text-xs leading-5 text-[var(--bsu-ink-3)]"
    >
      {{ caption }}
    </figcaption>
  </figure>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import QRCode from "qrcode";

const props = defineProps({
  value: { type: String, default: "" },
  caption: { type: String, default: "" },
  alt: { type: String, default: "Navigation QR code" },
});

const qrDataUrl = ref("");
const renderError = ref(false);
let cancelled = false;

async function render() {
  const text = String(props.value || "").trim();
  if (!text) {
    qrDataUrl.value = "";
    return;
  }
  renderError.value = false;
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 512,
    });
    if (!cancelled) {
      qrDataUrl.value = dataUrl;
    }
  } catch (_) {
    if (!cancelled) {
      renderError.value = true;
    }
  }
}

onMounted(render);

onUnmounted(() => {
  cancelled = true;
});

watch(
  () => props.value,
  () => render(),
);
</script>