<template>
  <Navbar />
  <div class="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <section
        class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div
          class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p
              class="text-sm font-semibold uppercase tracking-[0.28em] text-red-600"
            >
              Visitor Log
            </p>
            <h1 class="mt-2 text-3xl font-semibold text-slate-950">
              Daily / Monthly View
            </h1>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Filter visitor logs by date, name, and page through results in
              batches of 20.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              @click="clearFilters"
              class="rounded-3xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Clear filters
            </button>
            <button
              type="button"
              @click="applyFilters"
              class="rounded-3xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Apply filters
            </button>
          </div>
        </div>
      </section>

      <section
        class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div class="grid gap-6 lg:grid-cols-4">
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-slate-700"
              >Visitor name</label
            >
            <input
              v-model="visitorName"
              type="search"
              placeholder="Search by visitor full name"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >Date type</label
            >
            <select
              v-model="filterType"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
            >
              <option value="all">All dates</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div v-if="filterType === 'daily'">
            <label class="block text-sm font-medium text-slate-700"
              >Select day</label
            >
            <input
              type="date"
              v-model="selectedDate"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div v-if="filterType === 'monthly'">
            <label class="block text-sm font-medium text-slate-700"
              >Select month</label
            >
            <input
              type="month"
              v-model="selectedMonth"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>
      </section>

      <section
        class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div
          class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p class="text-sm text-slate-500">
              Showing
              <span class="font-semibold text-slate-900">{{
                visitorLogStore.logs.length
              }}</span>
              of
              <span class="font-semibold text-slate-900">{{
                visitorLogStore.total
              }}</span>
              logs
            </p>
          </div>
          <div class="text-sm text-slate-500">
            Page {{ visitorLogStore.page }} / {{ totalPages }}
          </div>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-slate-700">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">Time In</th>
                <th class="px-4 py-3 text-left font-semibold">Visitor</th>
                <th class="px-4 py-3 text-left font-semibold">Office</th>
                <th class="px-4 py-3 text-left font-semibold">Purpose</th>
                <th class="px-4 py-3 text-left font-semibold">Status</th>
                <th class="px-4 py-3 text-left font-semibold">Time Out</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <tr
                v-if="
                  !visitorLogStore.loading && visitorLogStore.logs.length === 0
                "
              >
                <td
                  colspan="5"
                  class="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No visitor logs found.
                </td>
              </tr>
              <tr
                v-for="log in visitorLogStore.logs"
                :key="log.id"
                @click="goToVisitorAccess(log)"
                class="cursor-pointer hover:bg-slate-100 transition"
              >
                <td class="whitespace-nowrap px-4 py-4 text-slate-700">
                  {{ formatDateTime(log.time_in) }}
                </td>
                <td class="px-4 py-4 text-slate-700">
                  <div class="font-semibold text-slate-900">
                    {{ log.visitor_name }}
                  </div>
                  <div class="text-sm text-slate-500">
                    {{ log.contact_number }}
                  </div>
                </td>
                <td class="px-4 py-4 text-slate-700">{{ log.office_name }}</td>
                <td class="px-4 py-4 text-slate-700">
                  {{ log.purpose || "-" }}
                </td>
                <td class="px-4 py-4 text-slate-700">
                  {{ log.status || "-" }}
                </td>
                <td class="px-4 py-4 text-slate-700">
                  {{ log.time_out ? formatDateTime(log.time_out) : "Active" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="mt-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between"
        >
          <div class="text-sm text-slate-500">
            Page size: {{ visitorLogStore.perPage }}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              @click="changePage(visitorLogStore.page - 1)"
              :disabled="visitorLogStore.page <= 1 || visitorLogStore.loading"
              class="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              v-for="page in pageButtons"
              :key="page"
              @click="changePage(page)"
              :class="[
                'rounded-3xl px-4 py-2 text-sm font-semibold transition',
                page === visitorLogStore.page
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50',
              ]"
            >
              {{ page }}
            </button>
            <button
              type="button"
              @click="changePage(visitorLogStore.page + 1)"
              :disabled="
                visitorLogStore.page >= totalPages || visitorLogStore.loading
              "
              class="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section
        v-if="visitorLogStore.error"
        class="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        {{ visitorLogStore.error }}
      </section>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { computed, onMounted, ref } from "vue";
import Navbar from "../../components/Navbar.vue";
import { useVisitorLogStore } from "../../store/visitorLog";

const visitorLogStore = useVisitorLogStore();
const router = useRouter();
const filterType = ref("all");
const selectedDate = ref("");
const selectedMonth = ref("");
const visitorName = ref("");

// Navigate to visitor access page when a log row is clicked
const goToVisitorAccess = (log) => {
  if (!log.token) {
    alert("No access link available for this visitor.");
    return;
  }

  router.push(`/visitor-access/${log.token}`);
};

// Compute total pages based on total logs and logs per page
const totalPages = computed(() =>
  Math.max(1, Math.ceil(visitorLogStore.total / visitorLogStore.perPage)),
);

const startDate = computed(() => {
  if (filterType.value === "daily" && selectedDate.value) {
    return selectedDate.value;
  }
  if (filterType.value === "monthly" && selectedMonth.value) {
    return `${selectedMonth.value}-01`;
  }
  return "";
});

const endDate = computed(() => {
  if (filterType.value === "daily" && selectedDate.value) {
    return selectedDate.value;
  }
  if (filterType.value === "monthly" && selectedMonth.value) {
    const [year, month] = selectedMonth.value.split("-");
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    return `${year}-${month.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }
  return "";
});

const getLogs = async (page = 1) => {
  await visitorLogStore.fetchVisitLogs({
    visitorName: visitorName.value.trim(),
    startDate: startDate.value,
    endDate: endDate.value,
    page,
    perPage: visitorLogStore.perPage,
  });
};

const applyFilters = () => getLogs(1);

const clearFilters = () => {
  visitorName.value = "";
  filterType.value = "all";
  selectedDate.value = "";
  selectedMonth.value = "";
  getLogs(1);
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    getLogs(page);
  }
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pageButtons = computed(() => {
  const pages = [];
  const maxButtons = 5;
  let start = Math.max(1, visitorLogStore.page - 2);
  let end = Math.min(totalPages.value, start + maxButtons - 1);
  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
});

onMounted(() => {
  getLogs(1);
});
</script>
