<script setup>
import { onMounted } from "vue";
import { useOfficeStore } from "@/store/office";

const officeStore = useOfficeStore();

const BASE_URL = window.location.origin;

onMounted(async () => {
  await officeStore.fetchOffices();
});
</script>

<template>
  <div class="container mx-auto px-4 py-10">
    <div
      class="mx-auto max-w-xl rounded-3xl border-2 border-[var(--bsu-line)] bg-white p-8 text-center shadow-xl md:p-10"
    >
      <p
        class="font-display rounded-full bg-[var(--bsu-red)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white inline-block"
      >
        BSU Visitor
      </p>
      <h1
        class="font-display mt-5 text-3xl font-bold text-[var(--bsu-ink)] md:text-4xl"
      >
        Scan to register your visit
      </h1>
      <p class="mt-3 text-sm text-[var(--bsu-ink-2)]">
        Visitors scan this code with their phone camera to register their
        visit on campus. The destination page lets them pick the office they're
        visiting.
      </p>

      <!-- Single QR — opens the public self-registration page -->
      <div
        class="mt-8 inline-block rounded-3xl border-4 border-[var(--bsu-red)] bg-white p-6 shadow-2xl"
      >
        <img
          :src="`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(BASE_URL + '/office')}`"
          alt="BSU Visitor QR code"
          class="h-72 w-72 object-contain md:h-96 md:w-96"
        />
      </div>

      <p
        class="mt-6 break-all font-mono text-xs text-[var(--bsu-red)]"
      >
        {{ BASE_URL }}/office
      </p>

      <div class="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--bsu-ink-3)]">
        <img
          src="/logo/BatStateU-NEU-Logo-1-300x282.png"
          alt="BSU"
          class="h-5 w-5"
        />
        <span>Batangas State University · NEU</span>
      </div>

      <button
        @click="window.print()"
        class="mt-8 rounded-lg bg-[var(--bsu-red)] px-5 py-2.5 font-bold text-white shadow-md hover:bg-[#a30e22]"
      >
        Print
      </button>
    </div>
  </div>
</template>

<style scoped>
.font-display {
  font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
}
</style>
