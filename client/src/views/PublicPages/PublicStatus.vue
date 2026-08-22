<template>
  <div class="min-h-[100dvh] bg-[#fbfaf7] text-[var(--bsu-ink)]">
    <div class="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 py-8 sm:px-6">
      <header>
        <div
          class="inline-flex items-center gap-2 rounded-full border border-[var(--bsu-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--bsu-red)]"
        >
          <Search class="h-3.5 w-3.5" aria-hidden="true" />
          Visit status
        </div>
        <h1 class="font-display mt-4 text-3xl font-bold tracking-tight">
          Check your visit
        </h1>
        <p class="mt-1 text-sm text-[var(--bsu-ink-2)]">
          Enter the reference shown on your registration screen to see your
          queue position and exit deadline.
        </p>
      </header>

      <main class="mt-8 flex-1">
        <!-- Token entry -->
        <form
          v-if="!loaded"
          class="rounded-3xl border border-[var(--bsu-line)] bg-white p-6 shadow-sm"
          @submit.prevent="lookup"
        >
          <label class="block">
            <span class="form-label">Reference number or token</span>
            <input
              v-model="tokenInput"
              type="text"
              class="form-input"
              placeholder="Paste your token or reference here"
              required
              autocomplete="off"
            />
          </label>
          <p v-if="error" class="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ error }}
          </p>
          <button
            type="submit"
            :disabled="lookingUp"
            class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--bsu-red)] px-5 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.01] hover:bg-[#a30e22] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="lookingUp" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {{ lookingUp ? "Checking…" : "Check status" }}
          </button>
          <router-link
            to="/register"
            class="mt-3 block text-center text-sm font-semibold text-[var(--bsu-red)] hover:underline"
          >
            Haven't registered yet? Register here →
          </router-link>
        </form>

        <!-- Result -->
        <div v-else class="space-y-4">
          <div class="rounded-3xl border border-[var(--bsu-line)] bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-wider text-[var(--bsu-ink-3)]">Status</p>
                <p class="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold" :class="badgeClass">
                  <span class="h-2 w-2 rounded-full" :class="dotClass"></span>
                  {{ statusLabel }}
                </p>
              </div>
              <div v-if="referenceNumber" class="text-right">
                <p class="text-xs uppercase tracking-wider text-[var(--bsu-ink-3)]">Reference</p>
                <p class="font-display mt-1 text-lg font-bold tabular tracking-tight">{{ referenceNumber }}</p>
              </div>
            </div>

            <p v-if="office" class="mt-4 text-sm text-[var(--bsu-ink-2)]">
              Visiting
              <span class="font-bold uppercase tracking-wide text-[var(--bsu-ink)]">{{ office.office_name }}</span>
            </p>

            <div v-if="queuePosition" class="mt-5 rounded-2xl border-2 border-[var(--bsu-red)]/30 bg-[var(--bsu-red-soft)] p-4 text-center">
              <p class="text-xs uppercase tracking-wider text-[var(--bsu-ink-2)]">Your queue position</p>
              <p class="font-display mt-1 text-4xl font-bold tabular text-[var(--bsu-red)]">#{{ queuePosition }}</p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-3xl border border-[var(--bsu-line)] bg-white p-5 shadow-sm">
              <p class="text-xs uppercase tracking-wider text-[var(--bsu-ink-3)]">Time in</p>
              <p class="mt-1 text-lg font-semibold">{{ formatServerTime(status.time_in) }}</p>
            </div>
            <div class="rounded-3xl border border-[var(--bsu-line)] bg-white p-5 shadow-sm">
              <p class="text-xs uppercase tracking-wider text-[var(--bsu-ink-3)]">Visited at</p>
              <p class="mt-1 text-lg font-semibold">{{ formatServerTime(status.time_out) }}</p>
            </div>
          </div>

          <div
            v-if="exitDeadline"
            class="rounded-3xl border p-5 shadow-sm"
            :class="isOverdue ? 'border-red-300 bg-red-50' : 'border-[var(--bsu-line)] bg-white'"
          >
            <p class="text-xs uppercase tracking-wider" :class="isOverdue ? 'text-red-700' : 'text-[var(--bsu-ink-3)]'">
              Exit deadline
            </p>
            <p class="mt-1 text-lg font-semibold" :class="isOverdue ? 'text-red-700' : ''">
              {{ formatServerDateTime(exitDeadline) }}
              <span v-if="isOverdue" class="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">Overdue</span>
            </p>
            <p v-if="isOverdue" class="mt-2 text-sm text-red-700">
              Please head to the guard house to sign out before leaving campus.
            </p>
            <p v-else class="mt-2 text-sm text-[var(--bsu-ink-2)]">
              Your completed visit must be signed out at the guard house by this time.
            </p>
          </div>

          <p v-if="leftAt" class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
            Signed out at {{ formatServerDateTime(leftAt) }}. Thank you for visiting!
          </p>

          <button
            type="button"
            @click="reset"
            class="w-full rounded-xl border-2 border-[var(--bsu-line)] px-4 py-3 text-sm font-bold text-[var(--bsu-ink-2)] transition hover:bg-white"
          >
            Check another visit
          </button>
        </div>
      </main>

      <footer class="mt-8 text-center text-xs leading-5 text-[var(--bsu-ink-3)]">
        Personal details are never displayed on this page. This page only shows
        your reference number, queue position, and exit deadline.
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { Search } from "@lucide/vue";
import { formatServerTime, formatServerDateTime, parseServerDate } from "@/utils/dateTime";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const route = useRoute();
const tokenInput = ref("");
const lookingUp = ref(false);
const loaded = ref(false);
const error = ref("");
const status = ref({});

const refToken = computed(() => tokenInput.value.trim());
const referenceNumber = computed(() => status.value.reference_number || "");
const office = computed(() => status.value.office || null);
const queuePosition = computed(() => status.value.queue_position || null);
const exitDeadline = computed(() => status.value.exit_deadline || "");
const leftAt = computed(() => status.value.left_at || "");
const isOverdue = computed(() => {
  const deadline = parseServerDate(exitDeadline.value);
  return !!deadline && deadline.getTime() < Date.now();
});

const statusLabel = computed(() => {
  switch (status.value.status) {
    case "pending": return "In queue";
    case "processing": return "With the office";
    case "completed": return "Visit finished";
    case "rejected": return "Not admitted";
    case "left": return "Signed out";
    default: return status.value.status || "—";
  }
});

const badgeClass = computed(() => {
  switch (status.value.status) {
    case "pending": return "bg-amber-50 text-amber-700 border border-amber-300";
    case "processing": return "bg-blue-50 text-blue-700 border border-blue-300";
    case "completed": return "bg-emerald-50 text-emerald-700 border border-emerald-300";
    case "left": return "bg-emerald-50 text-emerald-700 border border-emerald-300";
    case "rejected": return "bg-red-50 text-red-700 border border-red-300";
    default: return "bg-slate-100 text-slate-700 border border-slate-300";
  }
});

const dotClass = computed(() => {
  switch (status.value.status) {
    case "pending": return "bg-amber-500";
    case "processing": return "bg-blue-500";
    case "completed": return "bg-emerald-500";
    case "left": return "bg-emerald-500";
    case "rejected": return "bg-red-500";
    default: return "bg-slate-400";
  }
});

async function lookup() {
  if (!refToken.value) return;
  error.value = "";
  lookingUp.value = true;
  try {
    const res = await fetch(
      `${API_BASE}/public/status/${encodeURIComponent(refToken.value)}`,
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error.value = data.error || "Visit not found. Check your token and try again.";
      return;
    }
    status.value = data;
    loaded.value = true;
  } catch (e) {
    error.value = "Network error. Please check your connection.";
  } finally {
    lookingUp.value = false;
  }
}

function reset() {
  loaded.value = false;
  error.value = "";
  status.value = {};
  tokenInput.value = "";
}

onMounted(() => {
  const fromQuery = String(route.query.token || "").trim();
  const stored = (() => {
    try {
      return sessionStorage.getItem("bsu_visitor_token") || "";
    } catch (_) {
      return "";
    }
  })();
  tokenInput.value = fromQuery || stored;
});
</script>

<style scoped>
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
