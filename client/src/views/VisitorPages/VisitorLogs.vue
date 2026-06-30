<template>
  <Navbar />
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
                @click="goToVisitorAccess(log)"
                class="cursor-pointer transition-colors hover:bg-[var(--paper-2)]/40"
              >
                <td class="whitespace-nowrap px-6 py-3.5 font-mono text-xs tabular text-[var(--ink-2)]">
                  {{ formatDateTime(log.time_in) }}
                </td>
                <td class="px-6 py-3.5">
                  <p class="font-semibold">{{ log.visitor_name }}</p>
                  <p class="text-xs text-[var(--ink-3)] tabular">{{ log.contact_number || "—" }}</p>
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
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { computed, onMounted, ref } from "vue";
import Navbar from "@/components/Navbar.vue";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useVisitorLogStore } from "@/store/visitorLog";
import { useToast } from "@/composables/useToast";

const visitorLogStore = useVisitorLogStore();
const router = useRouter();
const toast = useToast();

const filterType = ref("all");
const selectedDate = ref("");
const selectedMonth = ref("");
const visitorName = ref("");

function goToVisitorAccess(log) {
  if (!log.token) {
    toast.warn("No access link for this visitor.");
    return;
  }
  router.push(`/visitor-access/${log.token}`);
}

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
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
