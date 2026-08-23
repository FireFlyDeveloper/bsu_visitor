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
          Your visits today
        </h1>
        <p class="mt-1 text-sm text-[var(--bsu-ink-2)]">
          Everyone you registered on this device. Tap a visit to see its
          status.
        </p>
      </header>

      <main class="mt-8 flex-1 space-y-3">
        <!-- Loading -->
        <div v-if="loadingInitial" class="space-y-3">
          <div v-for="i in Math.max(saves.length, 1)" :key="i" class="h-20 animate-pulse rounded-3xl border border-[var(--bsu-line)] bg-white" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!saves.length && !route.query.token"
          class="rounded-3xl border border-dashed border-[var(--bsu-line)] bg-white p-8 text-center"
        >
          <p class="font-display text-lg font-bold">No saved visits</p>
          <p class="mt-2 text-sm leading-6 text-[var(--bsu-ink-2)]">
            This device has no visit registrations yet. Register at an office,
            and your visits will appear here for the rest of the day.
          </p>
          <router-link
            to="/register"
            class="mt-5 inline-flex items-center justify-center rounded-xl bg-[var(--bsu-red)] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#a30e22]"
          >
            Register a visit →
          </router-link>
        </div>

        <!-- Saved visits list (clickable → modal) -->
        <template v-else>
          <button
            v-for="(visit, i) in saves"
            :key="visit.token"
            type="button"
            class="group flex w-full items-center gap-4 rounded-3xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            :class="selected?.token === visit.token ? 'border-[var(--bsu-red)]' : 'border-[var(--bsu-line)]'"
            @click="openVisit(visit)"
          >
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-bold tabular text-white"
              :class="statusMeta(visit).chip"
              v-text="i + 1"
            ></span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-display text-base font-bold tracking-tight">
                {{ visit.reference || "Visit " + (i + 1) }}
              </span>
              <span class="mt-0.5 block truncate text-xs text-[var(--bsu-ink-2)]">
                {{ visit.office || "Office pending" }}
                <template v-if="visit.summaryLabel"> · {{ visit.summaryLabel }}</template>
              </span>
            </span>
            <svg
              class="h-5 w-5 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--bsu-red)]"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>

          <router-link
            to="/register"
            class="mt-2 block rounded-3xl border border-dashed border-[var(--bsu-line)] p-4 text-center text-sm font-semibold text-[var(--bsu-red)] transition hover:bg-white"
          >
            + Register another person
          </router-link>
        </template>
      </main>

      <!-- Status detail modal -->
      <Teleport to="body">
        <Transition name="modal">
        <div
          v-if="selected"
          class="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          @click.self="closeModal"
        >
          <div class="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
            <button
              type="button"
              class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
              @click="closeModal"
            >
              ✕
            </button>

            <!-- loading this token -->
            <div v-if="modalLoading" class="space-y-3 py-6">
              <div class="h-16 animate-pulse rounded-2xl bg-slate-100" />
              <div class="h-10 animate-pulse rounded-2xl bg-slate-100" />
            </div>

            <!-- lookup error -->
            <div v-else-if="modalError" class="py-6 text-center">
              <p class="text-sm font-semibold text-red-700">{{ modalError }}</p>
              <p class="mt-2 text-xs text-slate-500">This visit may have expired from this device's saved list.</p>
            </div>

            <!-- detail -->
            <template v-else>
              <p class="eyebrow text-[0.65rem] font-bold uppercase tracking-widest text-[var(--bsu-red)]">Visit status</p>
              <div class="mt-2 flex items-start justify-between gap-4">
                <p class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold" :class="badgeClass">
                  <span class="h-2 w-2 rounded-full" :class="dotClass"></span>
                  {{ statusLabel }}
                </p>
                <p v-if="referenceNumber" class="text-right">
                  <span class="block text-[0.65rem] uppercase tracking-wider text-[var(--bsu-ink-3)]">Reference</span>
                  <span class="font-display text-lg font-bold tabular">{{ referenceNumber }}</span>
                </p>
              </div>

              <p v-if="office" class="mt-4 text-sm text-[var(--bsu-ink-2)]">
                Visiting
                <span class="font-bold uppercase tracking-wide">{{ office.office_name }}</span>
              </p>

              <div v-if="queuePosition" class="mt-5 rounded-2xl border-2 border-[var(--bsu-red)]/30 bg-[var(--bsu-red-soft)] p-4 text-center">
                <p class="text-xs uppercase tracking-wider text-[var(--bsu-ink-2)]">Your queue position</p>
                <p class="font-display mt-1 text-4xl font-bold tabular text-[var(--bsu-red)]">#{{ queuePosition }}</p>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-2xl border border-[var(--bsu-line)] p-4">
                  <p class="text-[0.65rem] uppercase tracking-wider text-[var(--bsu-ink-3)]">Time in</p>
                  <p class="mt-1 font-semibold">{{ formatServerTime(status.time_in) }}</p>
                </div>
                <div class="rounded-2xl border border-[var(--bsu-line)] p-4">
                  <p class="text-[0.65rem] uppercase tracking-wider text-[var(--bsu-ink-3)]">Time out</p>
                  <p class="mt-1 font-semibold">{{ formatServerTime(status.time_out) }}</p>
                </div>
              </div>

              <div
                v-if="exitDeadline"
                class="mt-3 rounded-2xl border p-4"
                :class="isOverdue ? 'border-red-300 bg-red-50' : 'border-[var(--bsu-line)]'"
              >
                <p class="text-[0.65rem] uppercase tracking-wider" :class="isOverdue ? 'text-red-700' : 'text-[var(--bsu-ink-3)]'">
                  Exit deadline
                </p>
                <p class="mt-1 font-semibold" :class="isOverdue ? 'text-red-700' : ''">
                  {{ formatServerDateTime(exitDeadline) }}
                  <span v-if="isOverdue" class="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-bold text-white">Overdue</span>
                </p>
                <p class="mt-2 text-xs leading-5 text-[var(--bsu-ink-2)]">
                  {{ isOverdue
                    ? "Please head to the guard house to sign out before leaving campus."
                    : "Completed visits must be signed out at the guard house by this time." }}
                </p>
              </div>

              <p v-if="leftAt" class="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                Signed out at {{ formatServerDateTime(leftAt) }}. Thank you for visiting!
              </p>
            </template>
          </div>
        </div>
        </Transition>
      </Teleport>

      <footer class="mt-8 text-center text-xs leading-5 text-[var(--bsu-ink-3)]">
        Personal details are never displayed here — only reference numbers,
        queue positions, and exit deadlines.
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { Search } from "@lucide/vue";
import { formatServerTime, formatServerDateTime, parseServerDate } from "@/utils/dateTime";
import { getVisitorTokens, saveVisitorToken } from "@/utils/visitorToken";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const route = useRoute();

const saves = ref([]);
const loadingInitial = ref(true);

const selected = ref(null);
const modalLoading = ref(false);
const modalError = ref("");
const status = ref({});

/* ---------- list ---------- */

function statusMeta(visit) {
  const s = (visit.summaryStatus || "").toLowerCase();
  if (s === "pending") return { chip: "bg-amber-500", label: "In queue" };
  if (s === "processing") return { chip: "bg-blue-500", label: "In progress" };
  if (s === "completed") return { chip: "bg-emerald-500", label: "Awaiting sign-out" };
  if (s === "left") return { chip: "bg-emerald-600", label: "Signed out" };
  if (s === "rejected") return { chip: "bg-red-500", label: "Not accepted" };
  return { chip: "bg-slate-400", label: "" };
}

async function refreshSummaries() {
  // Fetch each saved visit quietly so the list shows live status labels.
  await Promise.all(
    saves.value.map(async (visit) => {
      try {
        const res = await fetch(
          `${API_BASE}/public/status/${encodeURIComponent(visit.token)}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        visit.summaryStatus = data.status;
        visit.office =
          data.office?.office_name ||
          visit.office ||
          "";
      } catch (_) {
        /* keep last known summary */
      }
    }),
  );
}

onMounted(async () => {
  saves.value = getVisitorTokens();

  const deepLink = String(route.query.token || "").trim();
  if (deepLink) {
    // Deep links still work: make sure the linked visit is in the list, then open it.
    let entry = saves.value.find((v) => v.token === deepLink);
    if (!entry) {
      entry = { token: deepLink, reference: "", office: "", at: Date.now() };
      saveVisitorToken(entry);
      saves.value = getVisitorTokens();
    }
    openVisit(entry);
  }

  await refreshSummaries();
  loadingInitial.value = false;
});

/* ---------- modal ---------- */

async function openVisit(visit) {
  selected.value = visit;
  modalLoading.value = true;
  modalError.value = "";
  status.value = {};
  try {
    const res = await fetch(
      `${API_BASE}/public/status/${encodeURIComponent(visit.token)}`,
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      modalError.value = data.error || "Visit not found.";
      return;
    }
    status.value = data;
  } catch (_) {
    modalError.value = "Network error. Please check your connection.";
  } finally {
    modalLoading.value = false;
  }
}

function closeModal() {
  selected.value = null;
  status.value = {};
  modalError.value = "";
}

/* ---------- detail helpers ---------- */

const referenceNumber = computed(() => status.value.reference_number || "");
const office = computed(() => status.value.office || null);
const queuePosition = computed(() => status.value.queue_position || null);
const exitDeadline = computed(() =>
  parseServerDate(status.value.exit_deadline),
);
const isOverdue = computed(() => Boolean(status.value.overdue));
const leftAt = computed(() => status.value.left_at);

const statusLabel = computed(() => {
  switch (status.value.status) {
    case "pending": return "In queue";
    case "processing": return "In progress";
    case "completed": return "Done — sign out";
    case "left": return "Signed out";
    case "rejected": return "Not accepted";
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
</script>

<style scoped>
.font-display {
  font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
}
</style>
