<template>
  <div class="min-h-screen bg-[#fbfaf7] text-[var(--bsu-ink)]">
    <div class="mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
      <!-- Loading state -->
      <div
        v-if="loadingOffice"
        class="mt-12 flex flex-1 flex-col items-center justify-center"
      >
        <div
          class="h-10 w-10 animate-spin rounded-full border-4 border-[var(--bsu-red)]/20 border-t-[var(--bsu-red)]"
        />
        <p class="mt-4 text-sm text-[var(--bsu-ink-2)]">Loading destination…</p>
      </div>

      <!-- Office not found -->
      <div
        v-else-if="!office"
        class="mt-12 flex flex-1 flex-col items-center justify-center text-center"
      >
        <p class="text-6xl">🚫</p>
        <h1 class="mt-4 text-2xl font-bold">Office not found</h1>
        <p class="mt-2 text-sm text-[var(--bsu-ink-2)]">
          This QR code may be outdated. Please ask the guard for help.
        </p>
      </div>

      <!-- Destination picker (only when no officeId in URL and nothing picked yet) -->
      <div
        v-else-if="!officeId && !selectedOfficeId"
        class="mt-8 flex-1"
      >
        <div
          class="rounded-3xl bg-white p-6 text-[var(--bsu-ink)] shadow-2xl"
        >
          <p
            class="eyebrow text-[0.65rem] font-bold uppercase tracking-widest text-[var(--bsu-red)]"
          >
            Welcome
          </p>
          <h1
            class="font-display mt-2 text-3xl font-bold tracking-tight text-[var(--bsu-ink)]"
          >
            Which office are you visiting?
          </h1>
          <p class="mt-2 text-sm text-[var(--bsu-ink-2)]">
            Tap the office you're here to see. You'll register your visit on the
            next screen.
          </p>

          <div
            v-if="loadingOffices"
            class="mt-6 flex justify-center py-8"
          >
            <div
              class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--bsu-red)]/20 border-t-[var(--bsu-red)]"
            />
          </div>

          <div
            v-else-if="!offices.length"
            class="mt-6 rounded-xl border-2 border-dashed border-[var(--bsu-line)] p-8 text-center text-sm text-[var(--bsu-ink-3)]"
          >
            No offices available right now.
          </div>

          <div v-else class="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              v-for="o in offices"
              :key="o.id"
              type="button"
              @click="pickOffice(o.id)"
              class="group flex items-center justify-between gap-3 rounded-2xl border-2 border-[var(--bsu-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--bsu-red)] hover:shadow-lg"
            >
              <div class="min-w-0">
                <p
                  class="font-display truncate text-lg font-bold uppercase tracking-wider text-[var(--bsu-ink)]"
                >
                  {{ o.office_name }}
                </p>
                <p
                  class="mt-0.5 text-xs font-medium uppercase tracking-wider"
                  :class="o.status === 'available' ? 'text-emerald-600' : 'text-slate-500'"
                >
                  {{ o.status || "unknown" }}
                </p>
              </div>
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bsu-red)] text-white transition-transform group-hover:scale-110"
              >
                →
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Registration form / success — shared public component -->
      <PublicRegistration
        v-else
        :office="office"
        :loading="loadingOffice"
        :show-back="!officeId"
        @back="backToPicker"
        @submitted="submitted = true"
      />

      <p
        v-if="!submitted && officeId && !loadingOffice && office"
        class="mt-6 text-center text-xs text-[var(--bsu-ink-2)]"
      >
        Your information is used only for campus visit records.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import PublicRegistration from "@/components/PublicRegistration.vue";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const route = useRoute();
// /office (no id) → pick destination. /office/:id → register to that office.
const officeId = route.params.id ? Number(route.params.id) : null;
const office = ref(null);
const loadingOffice = ref(true);
const submitted = ref(false);

// Destination picker state
const offices = ref([]);
const loadingOffices = ref(false);
const selectedOfficeId = ref(null);

async function loadOffices() {
  loadingOffices.value = true;
  try {
    const res = await fetch(`${API_BASE}/public/offices`);
    if (res.ok) {
      const data = await res.json();
      // Handle both shapes: { offices: [...] } and direct array
      offices.value = Array.isArray(data) ? data : (data.offices || []);
    }
  } catch (_) {
    /* empty list */
  } finally {
    loadingOffices.value = false;
  }
}

onMounted(async () => {
  if (officeId) {
    try {
      const res = await fetch(`${API_BASE}/public/office/${officeId}`);
      if (res.ok) {
        office.value = await res.json();
      }
    } catch (_) {
      /* leave office null → not-found state */
    } finally {
      loadingOffice.value = false;
    }
  } else {
    loadingOffice.value = false;
    await loadOffices();
  }
});

function pickOffice(id) {
  selectedOfficeId.value = id;
  office.value = offices.value.find((o) => o.id === id) || null;
  loadingOffice.value = false;
}

function backToPicker() {
  office.value = null;
  selectedOfficeId.value = null;
  submitted.value = false;
}
</script>

<style scoped>
.eyebrow {
  letter-spacing: 0.12em;
}
.font-display {
  font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
}
.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--bsu-ink-2);
  margin-bottom: 0.35rem;
}
.form-input {
  width: 100%;
  border-radius: 0.6rem;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.7rem 0.9rem;
  font-size: 0.95rem;
  color: var(--bsu-ink);
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.form-input:focus {
  border-color: var(--bsu-red);
  background: #fff;
}
</style>
