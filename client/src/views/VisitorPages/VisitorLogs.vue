<template>
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <!-- Header -->
      <header class="rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Records</p>
          <h1 class="mt-2 text-4xl font-bold tracking-tight">Visitor log</h1>
          <p class="lede mt-2 max-w-xl">
            Every check-in across the campus. Filter by date, name, or status.
            Click a row to open the visitor access page.
          </p>
        </div>
        <div class="flex gap-2">
          <AppButton variant="secondary" @click="clearFilters">Clear filters</AppButton>
          <AppButton variant="primary" @click="applyFilters">Apply</AppButton>
        </div>
      </header>

      <!-- Filter bar -->
      <section class="surface rise rise-delay-1 p-5">
        <div class="grid gap-4 md:grid-cols-12">
          <div class="md:col-span-5">
            <label class="label">Visitor name</label>
            <input v-model="visitorName" type="search" class="input" placeholder="Search by full name" />
          </div>
          <div class="md:col-span-3">
            <label class="label">Date type</label>
            <select v-model="filterType" class="select">
              <option value="all">All dates</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div v-if="filterType === 'daily'" class="md:col-span-4">
            <label class="label">Select day</label>
            <input type="date" v-model="selectedDate" class="input" />
          </div>
          <div v-else-if="filterType === 'monthly'" class="md:col-span-4">
            <label class="label">Select month</label>
            <input type="month" v-model="selectedMonth" class="input" />
          </div>
        </div>
      </section>

      <!-- Table -->
      <section class="surface rise rise-delay-2 overflow-hidden">
        <div class="flex flex-col gap-2 border-b border-[var(--line)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-[var(--ink-2)]">
            Showing
            <span class="font-semibold text-[var(--ink)] tabular">{{ visitorLogStore.logs.length }}</span>
            of
            <span class="font-semibold text-[var(--ink)] tabular">{{ visitorLogStore.total }}</span>
            logs
          </p>
          <p class="font-mono text-xs tabular text-[var(--ink-3)]">
            Page {{ visitorLogStore.page }} / {{ totalPages }}
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--line)] bg-[var(--paper-2)]/40 text-left text-[0.6875rem] uppercase tracking-wider text-[var(--ink-3)]">
                <th class="px-6 py-3 font-semibold">Time in</th>
                <th class="px-6 py-3 font-semibold">Visitor</th>
                <th class="px-6 py-3 font-semibold">Office</th>
                <th class="px-6 py-3 font-semibold">Purpose</th>
                <th class="px-6 py-3 font-semibold">Status</th>
                <th class="px-6 py-3 font-semibold">Time out</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--line)]">
              <tr v-if="visitorLogStore.loading && !visitorLogStore.logs.length">
                <td colspan="6" class="px-6 py-4">
                  <div class="space-y-2">
                    <Skeleton v-for="i in 5" :key="i" height="40" />
                  </div>
                </td>
              </tr>
              <tr v-else-if="!visitorLogStore.logs.length">
                <td colspan="6">
                  <EmptyState
                    icon="search"
                    title="No logs match your filters"
                    description="Try clearing the date or visitor name to widen the search."
                  />
                </td>
              </tr>
              <tr
                v-for="log in visitorLogStore.logs"
                :key="log.id"
                class="cursor-pointer transition-colors hover:bg-[var(--paper-2)]/40 focus-visible:bg-[var(--paper-2)]/60 focus-visible:outline-none"
                tabindex="0"
                :aria-label="`View visit details for ${log.visitor_name}`"
                @click="openLog(log)"
                @keydown.enter.prevent="openLog(log)"
              >
                <td class="whitespace-nowrap px-6 py-3.5 font-mono text-xs tabular text-[var(--ink-2)]">
                  {{ formatDateTime(log.time_in) }}
                </td>
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-3">
                    <img
                      v-if="log.visitor_img"
                      :src="visitorImageUrl(log.visitor_img)"
                      :alt="log.visitor_name"
                      class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[var(--line)]"
                      loading="lazy"
                      @error="(e) => (e.target.style.display = 'none')"
                    />
                    <div
                      v-else
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--paper-2)] text-xs font-semibold uppercase text-[var(--ink-2)] ring-1 ring-[var(--line)]"
                    >
                      {{ (log.visitor_name || "?").charAt(0) }}
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-semibold">{{ log.visitor_name }}</p>
                      <p class="truncate text-xs text-[var(--ink-3)] tabular">
                        {{ log.contact_number || "—" }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-3.5">{{ log.office_name }}</td>
                <td class="px-6 py-3.5 text-[var(--ink-2)]">{{ log.purpose || "—" }}</td>
                <td class="px-6 py-3.5">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                    :class="statusTone(log.status)"
                  >
                    {{ log.status || "—" }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-3.5 font-mono text-xs tabular text-[var(--ink-2)]">
                  {{ log.time_out ? formatDateTime(log.time_out) : "Active" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex flex-col items-start gap-3 border-t border-[var(--line)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-[var(--ink-3)]">
            Page size: <span class="tabular text-[var(--ink-2)]">{{ visitorLogStore.perPage }}</span>
          </p>
          <div class="flex flex-wrap items-center gap-1">
            <button class="btn btn-ghost btn-sm" :disabled="visitorLogStore.page <= 1 || visitorLogStore.loading" @click="changePage(visitorLogStore.page - 1)">
              ← Previous
            </button>
            <button
              v-for="page in pageButtons"
              :key="page"
              class="btn btn-sm"
              :class="page === visitorLogStore.page ? 'btn-primary' : 'btn-ghost'"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            <button class="btn btn-ghost btn-sm" :disabled="visitorLogStore.page >= totalPages || visitorLogStore.loading" @click="changePage(visitorLogStore.page + 1)">
              Next →
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Visit detail modal -->
    <BaseModal :model-value="!!selectedLog" @update:model-value="closeLog">
      <template v-if="selectedLog" #header>
        <div class="flex items-center gap-4">
          <!-- ID-sized visitor picture (1:1 portrait, like a 2x2 ID photo) -->
          <img
            v-if="selectedLog.visitor_img"
            :src="visitorImageUrl(selectedLog.visitor_img)"
            :alt="`ID picture of ${selectedLog.visitor_name}`"
            class="h-28 w-28 shrink-0 rounded-lg border border-[var(--line)] object-cover shadow-sm ring-1 ring-[var(--line)]"
            @error="(e) => (e.target.style.display = 'none')"
          />
          <div
            v-else
            class="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--paper-2)] text-3xl font-semibold uppercase text-[var(--ink-2)]"
          >
            {{ (selectedLog.visitor_name || "?").charAt(0) }}
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-lg font-bold">{{ selectedLog.visitor_name }}</h2>
            <p class="mt-1 truncate text-xs tabular text-[var(--ink-3)]">
              {{ selectedLog.contact_number || "No contact number" }}
            </p>
          </div>
        </div>
      </template>

      <template v-if="selectedLog">
        <dl class="space-y-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-[var(--ink-3)]">Office</dt>
            <dd class="text-right font-semibold">{{ selectedLog.office_name }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-[var(--ink-3)]">Purpose</dt>
            <dd class="max-w-[60%] text-right" :class="selectedLog.purpose ? 'font-medium' : 'text-[var(--ink-3)]'">
              {{ selectedLog.purpose || "—" }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-[var(--ink-3)]">Status</dt>
            <dd>
              <span
                class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                :class="statusTone(selectedLog.status)"
              >
                {{ selectedLog.status || "—" }}
              </span>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-[var(--ink-3)]">Time in</dt>
            <dd class="tabular font-mono text-xs">{{ formatDateTime(selectedLog.time_in) }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-[var(--ink-3)]">Time out</dt>
            <dd class="tabular font-mono text-xs">
              {{ selectedLog.time_out ? formatDateTime(selectedLog.time_out) : "Still on campus" }}
            </dd>
          </div>
        </dl>
      </template>

      <template v-if="selectedLog" #footer>
        <AppButton variant="secondary" @click="closeLog">Close</AppButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import BaseModal from "@/components/BaseModal.vue";
import { useVisitorLogStore } from "@/store/visitorLog";
import { formatServerDateTime } from "@/utils/dateTime";
import { visitorImageUrl } from "@/utils/visitorImageUrl";

const visitorLogStore = useVisitorLogStore();

const selectedLog = ref(null);

function openLog(log) {
  selectedLog.value = log;
}
function closeLog() {
  selectedLog.value = null;
}

const filterType = ref("all");
const selectedDate = ref("");
const selectedMonth = ref("");
const visitorName = ref("");

const totalPages = computed(() =>
  Math.max(1, Math.ceil(visitorLogStore.total / visitorLogStore.perPage)),
);

const startDate = computed(() => {
  if (filterType.value === "daily" && selectedDate.value) return selectedDate.value;
  if (filterType.value === "monthly" && selectedMonth.value) return `${selectedMonth.value}-01`;
  return "";
});
const endDate = computed(() => {
  if (filterType.value === "daily" && selectedDate.value) return selectedDate.value;
  if (filterType.value === "monthly" && selectedMonth.value) {
    const [year, month] = selectedMonth.value.split("-");
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    return `${year}-${month.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }
  return "";
});

async function getLogs(page = 1) {
  await visitorLogStore.fetchVisitLogs({
    visitorName: visitorName.value.trim(),
    startDate: startDate.value,
    endDate: endDate.value,
    page,
    perPage: visitorLogStore.perPage,
  });
}

function applyFilters() { getLogs(1); }
function clearFilters() {
  visitorName.value = "";
  filterType.value = "all";
  selectedDate.value = "";
  selectedMonth.value = "";
  getLogs(1);
}
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) getLogs(page);
}

function formatDateTime(value) {
  return formatServerDateTime(value);
}

function statusTone(s) {
  const v = (s || "").toLowerCase();
  if (v === "completed" || v === "approved") return "bg-emerald-50 text-emerald-700";
  if (v === "pending") return "bg-amber-50 text-amber-700";
  if (v.includes("cancel") || v === "rejected") return "bg-rose-50 text-rose-700";
  return "bg-[var(--paper-2)] text-[var(--ink-2)]";
}

const pageButtons = computed(() => {
  const pages = [];
  const maxButtons = 5;
  let start = Math.max(1, visitorLogStore.page - 2);
  let end = Math.min(totalPages.value, start + maxButtons - 1);
  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
});

onMounted(() => getLogs(1));
</script>
