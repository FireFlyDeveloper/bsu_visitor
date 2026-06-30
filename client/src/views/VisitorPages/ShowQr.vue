<script setup>
import { onMounted, ref, computed } from "vue";
import { useOfficeStore } from "@/store/office";

const officeStore = useOfficeStore();
const currentIndex = ref(0);

const BASE_URL = window.location.origin;

const sortedOffices = computed(() => {
  return [...(officeStore.offices || [])].sort((a, b) => {
    return String(a.office_name).localeCompare(String(b.office_name));
  });
});

const currentOffice = computed(() => sortedOffices.value[currentIndex.value]);

// FIXED URL — same QR per office, never changes per visitor.
// Print this and stick it on the office door.
const officeAccessUrl = (officeId) => {
  return `${BASE_URL}/office/${officeId}`;
};

const generateQR = (officeId) => {
  const url = encodeURIComponent(officeAccessUrl(officeId));
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${url}`;
};

const next = () => {
  if (sortedOffices.value.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % sortedOffices.value.length;
  }
};

const prev = () => {
  if (sortedOffices.value.length > 0) {
    currentIndex.value =
      currentIndex.value === 0
        ? sortedOffices.value.length - 1
        : currentIndex.value - 1;
  }
};

const goToIndex = (i) => (currentIndex.value = i);

const printCurrent = () => window.print();

onMounted(async () => {
  await officeStore.fetchOffices();
  if (sortedOffices.value.length > 0) currentIndex.value = 0;
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Top bar -->
    <div
      class="flex flex-col items-center justify-between gap-3 mb-6 rounded-2xl border-2 border-[var(--bsu-red)] bg-white p-4 shadow-sm sm:flex-row"
    >
      <div>
        <p class="eyebrow text-[0.65rem]">Office QR codes</p>
        <h1 class="mt-1 text-2xl font-bold text-[var(--bsu-ink)]">
          Print &amp; stick on each office door
        </h1>
        <p class="text-sm text-[var(--bsu-ink-2)]">
          One fixed QR per destination. Visitors scan to self-register.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="prev"
          class="rounded-lg border-2 border-[var(--bsu-red)] bg-white px-3 py-2 font-bold text-[var(--bsu-red)] hover:bg-[var(--bsu-red)] hover:text-white"
        >
          ←
        </button>
        <button
          @click="next"
          class="rounded-lg border-2 border-[var(--bsu-red)] bg-white px-3 py-2 font-bold text-[var(--bsu-red)] hover:bg-[var(--bsu-red)] hover:text-white"
        >
          →
        </button>
        <button
          @click="printCurrent"
          class="rounded-lg bg-[var(--bsu-red)] px-4 py-2 font-bold text-white shadow-md hover:bg-[#a30e22]"
        >
          Print
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="sortedOffices.length === 0"
      class="text-center py-16 rounded-2xl border-2 border-dashed border-[var(--bsu-line)]"
    >
      <p class="text-5xl">🏢</p>
      <p class="mt-4 text-lg font-semibold text-[var(--bsu-ink)]">
        No offices yet
      </p>
      <p class="mt-1 text-sm text-[var(--bsu-ink-2)]">
        Add offices in the admin panel to generate their QR codes.
      </p>
    </div>

    <!-- QR card -->
    <div
      v-else
      class="rounded-3xl border-2 border-[var(--bsu-line)] bg-white p-6 shadow-xl md:p-10"
    >
      <div class="flex flex-col items-center">
        <!-- Office header -->
        <p
          class="font-display rounded-full bg-[var(--bsu-red)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white"
        >
          {{ currentOffice.office_name }}
        </p>
        <h2
          class="font-display mt-4 text-3xl font-bold text-[var(--bsu-ink)] md:text-4xl"
        >
          Scan to register your visit
        </h2>
        <p class="mt-2 max-w-md text-center text-sm text-[var(--bsu-ink-2)]">
          Visitors scan this code with their phone camera to sign in to
          <strong>{{ currentOffice.office_name }}</strong
          >. The same code is used by every visitor — print and stick it on the
          office door.
        </p>

        <!-- QR code -->
        <div
          class="mt-8 rounded-3xl border-4 border-[var(--bsu-red)] bg-white p-6 shadow-2xl"
        >
          <img
            :src="generateQR(currentOffice.id)"
            :alt="`QR code for ${currentOffice.office_name}`"
            class="h-80 w-80 object-contain md:h-96 md:w-96"
          />
        </div>

        <!-- URL -->
        <div
          class="mt-6 max-w-xl rounded-xl border border-[var(--bsu-line)] bg-[var(--bsu-paper-2)] p-3"
        >
          <p class="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--bsu-ink-3)]">
            Destination URL (fixed)
          </p>
          <p
            class="mt-1 break-all font-mono text-xs text-[var(--bsu-red)]"
          >
            {{ officeAccessUrl(currentOffice.id) }}
          </p>
        </div>

        <!-- BSU brand mark -->
        <div class="mt-6 flex items-center gap-2 text-xs text-[var(--bsu-ink-3)]">
          <img
            src="/logo/BatStateU-NEU-Logo-1-300x282.png"
            alt="BSU"
            class="h-5 w-5"
          />
          <span>BSU Visitor · Batangas State University</span>
        </div>
      </div>

      <!-- Office picker chips -->
      <div
        class="mt-8 flex flex-wrap justify-center gap-2 border-t border-[var(--bsu-line)] pt-6"
      >
        <button
          v-for="(office, idx) in sortedOffices"
          :key="office.id"
          @click="goToIndex(idx)"
          :class="[
            'rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
            currentIndex === idx
              ? 'bg-[var(--bsu-red)] text-white shadow-md'
              : 'bg-[var(--bsu-paper-2)] text-[var(--bsu-ink-2)] hover:bg-[var(--bsu-red-soft)] hover:text-[var(--bsu-red)]',
          ]"
        >
          {{ office.office_name }}
        </button>
      </div>

      <p class="mt-4 text-center text-xs text-[var(--bsu-ink-3)]">
        Office {{ currentIndex + 1 }} of {{ sortedOffices.length }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.eyebrow {
  letter-spacing: 0.12em;
  font-weight: 700;
  color: var(--bsu-red);
  text-transform: uppercase;
  font-size: 0.65rem;
}
.font-display {
  font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
}
</style>
