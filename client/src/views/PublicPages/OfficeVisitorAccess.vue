<template>
  <div
    class="min-h-screen bg-gradient-to-br from-[var(--bsu-red)] via-[var(--bsu-red)] to-[#7a0e1e] text-white"
  >
    <div class="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <!-- Header: BSU brand -->
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img
            src="/logo/BatStateU-NEU-Logo-1-300x282.png"
            alt="BSU"
            class="h-10 w-10"
          />
          <div>
            <p class="font-display text-sm font-bold tracking-tight">
              BSU Visitor
            </p>
            <p class="text-[0.65rem] text-white/80">
              Batangas State University
            </p>
          </div>
        </div>
        <img
          src="/logo/BAGONG_PILIPINAS_LOGO-e1693281031955.png"
          alt="Bagong Pilipinas"
          class="h-9 w-9"
        />
      </header>

      <!-- Loading state -->
      <div
        v-if="loadingOffice"
        class="mt-12 flex flex-1 flex-col items-center justify-center"
      >
        <div
          class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"
        />
        <p class="mt-4 text-sm text-white/80">Loading destination…</p>
      </div>

      <!-- Office not found -->
      <div
        v-else-if="!office"
        class="mt-12 flex flex-1 flex-col items-center justify-center text-center"
      >
        <p class="text-6xl">🚫</p>
        <h1 class="mt-4 text-2xl font-bold">Office not found</h1>
        <p class="mt-2 text-sm text-white/80">
          This QR code may be outdated. Please ask the guard for help.
        </p>
      </div>

      <!-- Success state -->
      <div
        v-else-if="submitted"
        class="mt-12 flex flex-1 flex-col items-center justify-center text-center"
      >
        <div
          class="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl"
        >
          <svg
            class="h-12 w-12 text-[var(--bsu-red)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 class="mt-6 text-3xl font-bold">You're registered</h1>
        <div
          v-if="submittedVisitorImg"
          class="mt-5 flex flex-col items-center"
        >
          <img
            :src="submittedVisitorImg"
            :alt="form.fullname"
            class="h-24 w-24 rounded-full border-4 border-white/30 object-cover shadow-xl"
          />
          <p class="mt-3 text-sm font-semibold text-white/90">
            {{ form.fullname }}
          </p>
        </div>
        <p class="mt-3 max-w-sm text-sm text-white/90">
          Please proceed to
          <span class="font-bold uppercase tracking-wider">
            {{ office.office_name }}
          </span>
          and wait to be called.
        </p>
        <div
          class="mt-8 rounded-2xl border-2 border-white/30 bg-white/10 p-5 backdrop-blur"
        >
          <p class="text-xs uppercase tracking-wider text-white/70">
            Visit ID
          </p>
          <p class="font-display mt-1 text-3xl font-bold tabular">
            #{{ submittedLogId }}
          </p>
        </div>

        <router-link
          :to="{
            path: '/navigate',
            query: { to: office.id, name: office.office_name },
          }"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-base font-bold text-[var(--bsu-red)] shadow-lg transition-transform hover:scale-[1.02] active:scale-100"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 11l19-9-9 19-2-8-8-2z"
            />
          </svg>
          Navigate with AR →
        </router-link>
        <p class="mt-2 text-xs text-white/70">
          Opens your camera and shows the way to
          {{ office.office_name }}.
        </p>
      </div>

      <!-- Destination picker (only when no officeId in URL) -->
      <div
        v-else-if="!officeId && !submitted"
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

      <!-- Registration form -->
      <div v-else class="mt-8 flex-1">
        <div class="rounded-3xl bg-white p-6 text-[var(--bsu-ink)] shadow-2xl">
          <button
            v-if="!officeId"
            type="button"
            @click="backToPicker"
            class="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--bsu-red)] hover:underline"
          >
            ← Change office
          </button>
          <p
            class="eyebrow text-[0.65rem] font-bold uppercase tracking-widest text-[var(--bsu-red)]"
          >
            You're visiting
          </p>
          <h1
            class="font-display mt-2 text-3xl font-bold tracking-tight text-[var(--bsu-ink)]"
          >
            {{ office.office_name }}
          </h1>
          <p class="mt-2 text-sm text-[var(--bsu-ink-2)]">
            Fill in your details to register your visit. The office will be
            notified.
          </p>

          <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
            <label class="block">
              <span class="form-label">Full name</span>
              <input
                v-model="form.fullname"
                type="text"
                class="form-input"
                placeholder="Juan Dela Cruz"
                required
                autocomplete="name"
              />
            </label>
            <label class="block">
              <span class="form-label">Contact number</span>
              <input
                v-model="form.contact_number"
                type="tel"
                class="form-input"
                placeholder="0917 123 4567"
                required
                autocomplete="tel"
                inputmode="tel"
              />
            </label>
            <label class="block">
              <span class="form-label">Address</span>
              <input
                v-model="form.address"
                type="text"
                class="form-input"
                placeholder="City, Province"
                required
                autocomplete="street-address"
              />
            </label>
            <label class="block">
              <span class="form-label">Purpose of visit (optional)</span>
              <textarea
                v-model="form.purpose"
                rows="2"
                class="form-input resize-none"
                placeholder="e.g. Inquire about enrollment"
              />
            </label>

            <p
              v-if="formError"
              class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {{ formError }}
            </p>

            <button
              type="submit"
              :disabled="submitting"
              class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--bsu-red)] px-5 py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.01] hover:bg-[#a30e22] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                v-if="submitting"
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              {{ submitting ? "Registering…" : "Register visit" }}
            </button>
          </form>
        </div>

        <p class="mt-6 text-center text-xs text-white/70">
          Your information is used only for campus visit records.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

const API_BASE = import.meta.env.VITE_API_BASE;

const route = useRoute();
// /office (no id) → pick destination. /office/:id → register to that office.
const officeId = route.params.id ? Number(route.params.id) : null;
const office = ref(null);
const loadingOffice = ref(true);
const formError = ref("");
const submitting = ref(false);
const submitted = ref(false);
const submittedLogId = ref(null);
const submittedVisitorImg = ref(null);

// Destination picker state
const offices = ref([]);
const loadingOffices = ref(false);
const selectedOfficeId = ref(null);

const form = reactive({
  fullname: "",
  contact_number: "",
  address: "",
  purpose: "",
});

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
  formError.value = "";
  form.fullname = "";
  form.contact_number = "";
  form.address = "";
  form.purpose = "";
}

async function onSubmit() {
  formError.value = "";
  submitting.value = true;
  const targetId = officeId || selectedOfficeId.value;
  try {
    const res = await fetch(
      `${API_BASE}/public/office/${targetId}/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: form.fullname.trim(),
          contact_number: form.contact_number.trim(),
          address: form.address.trim(),
          purpose: form.purpose.trim(),
        }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      formError.value = data.error || "Registration failed. Please try again.";
      return;
    }
    submittedLogId.value = data.logId;
    submittedVisitorImg.value = data.visitor?.img || null;
    submitted.value = true;
  } catch (e) {
    formError.value = "Network error. Please check your connection.";
  } finally {
    submitting.value = false;
  }
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
