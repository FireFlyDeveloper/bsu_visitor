<template>
  <div class="mx-auto max-w-6xl px-4 py-6">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
            Visitor Queue
          </h1>
          <p class="text-sm text-slate-500 mt-1 capitalize">
            {{ currentStatus }} visitor requests
          </p>
        </div>
        <!-- Status Indicator Badge -->
        <div class="hidden sm:block">
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
              ></span>
            </span>
            Auto-refreshing every 10s
          </div>
        </div>
      </div>

      <!-- Modern Status Tabs -->
      <div class="mt-6 border-b border-slate-200">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            v-for="status in statuses"
            :key="status"
            @click="changeStatus(status)"
            class="relative px-5 py-2.5 text-sm font-medium transition-all duration-200 rounded-t-lg"
            :class="[
              currentStatus === status
                ? 'text-red-700 bg-white border-x border-t border-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
            ]"
          >
            {{ status }}
            <span
              v-if="currentStatus === status"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
            ></span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="store.error"
      class="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4"
    >
      <div class="flex items-center">
        <div class="shrink-0">
          <svg
            class="h-5 w-5 text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ store.error }}</p>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div
      class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <!-- Loading Overlay -->
      <div v-if="store.loading" class="relative">
        <div
          class="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <div class="flex flex-col items-center gap-2">
            <div
              class="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin"
            ></div>
            <span class="text-sm text-slate-500">Loading...</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="store.logs.length === 0 && !store.loading"
        class="py-16 text-center"
      >
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4"
        >
          <svg
            class="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p class="text-slate-500 font-medium">
          No {{ currentStatus }} visitors
        </p>
        <p class="text-sm text-slate-400 mt-1">All caught up!</p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/50">
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Visitor
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Purpose
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Office
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Time In
              </th>
              <th class="px-6 py-3.5 text-center font-semibold text-slate-700">
                Status
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="log in store.logs"
              :key="log.id"
              @click="openConfirm(log)"
              class="group transition-all duration-150 hover:bg-slate-50 cursor-pointer"
              :class="{
                'opacity-60 hover:opacity-70 cursor-not-allowed':
                  log.status === 'completed',
              }"
            >
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-linear-to-br from-red-100 to-red-50 flex items-center justify-center"
                  >
                    <span class="text-red-700 font-medium text-xs">
                      {{ log.visitor_name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <span class="font-medium text-slate-800">{{
                    log.visitor_name
                  }}</span>
                </div>
              </td>

              <td class="px-6 py-3.5 text-slate-600">
                <div class="max-w-xs truncate">{{ log.purpose }}</div>
              </td>

              <td class="px-6 py-3.5">
                <div class="flex items-center gap-1.5">
                  <svg
                    class="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span class="text-slate-600">{{ log.office_name }}</span>
                </div>
              </td>

              <td class="px-6 py-3.5 text-slate-500">
                <div class="flex items-center gap-1.5">
                  <svg
                    class="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ log.time_in }}
                </div>
              </td>

              <td class="px-6 py-3.5 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-red-100 text-red-700': log.status === 'pending',
                    'bg-yellow-100 text-yellow-700':
                      log.status === 'processing',
                    'bg-green-100 text-green-700': log.status === 'completed',
                  }"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full mr-1.5"
                    :class="{
                      'bg-red-500': log.status === 'pending',
                      'bg-yellow-500': log.status === 'processing',
                      'bg-green-500': log.status === 'completed',
                    }"
                  ></span>
                  {{ log.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modern Pagination -->
    <div class="mt-6 flex items-center justify-between">
      <div class="text-sm text-slate-500">
        Page <span class="font-medium text-slate-700">{{ store.page }}</span>
      </div>

      <div class="flex gap-2">
        <button
          @click="prevPage"
          :disabled="store.page <= 1 || store.loading"
          class="relative inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        <button
          @click="nextPage"
          :disabled="store.loading"
          class="relative inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          Next
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Modern Modal -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        ></div>

        <!-- Modal Panel -->
        <div
          class="relative bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-slate-800">
                Confirm Action
              </h2>
              <button
                @click="closeModal"
                class="text-slate-400 hover:text-slate-500 transition-colors"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div v-if="selectedLog" class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div
                  class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
                >
                  <span class="text-red-700 font-semibold">
                    {{ selectedLog.visitor_name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <p class="font-medium text-slate-800">
                    {{ selectedLog.visitor_name }}
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ selectedLog.purpose }}
                  </p>
                </div>
              </div>

              <p class="text-slate-600">
                Mark this visitor as
                <span
                  class="font-semibold inline-flex items-center gap-1"
                  :class="{
                    'text-yellow-600': nextStatus === 'processing',
                    'text-green-600': nextStatus === 'completed',
                  }"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="{
                      'bg-yellow-500': nextStatus === 'processing',
                      'bg-green-500': nextStatus === 'completed',
                    }"
                  ></span>
                  {{ nextStatus }}
                </span>
                ?
              </p>
            </div>

            <div class="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                @click="closeModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                @click="confirmNextStatus"
                class="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                :class="{
                  'bg-yellow-500 hover:bg-yellow-600 shadow-sm':
                    nextStatus === 'processing',
                  'bg-green-600 hover:bg-green-700 shadow-sm':
                    nextStatus === 'completed',
                }"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useVisitorLogStore } from "@/store/visitorLog";

const store = useVisitorLogStore();

const isModalOpen = ref(false);
const selectedLog = ref(null);

const currentStatus = ref("pending");
const statuses = ["pending", "processing", "completed"];

// Determine next status
const nextStatus = computed(() => {
  if (!selectedLog.value) return "";

  if (selectedLog.value.status === "pending") return "processing";
  if (selectedLog.value.status === "processing") return "completed";

  return "";
});

const loadStatus = async (status = currentStatus.value, page = store.page) => {
  currentStatus.value = status;

  await store.fetchByStatus({
    status,
    page,
    perPage: store.perPage,
  });
};

const changeStatus = (status) => {
  store.page = 1;
  loadStatus(status, 1);
};

// Allow pending + processing only
const openConfirm = (log) => {
  if (log.status === "completed") return;

  selectedLog.value = log;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedLog.value = null;
};

// Dynamic request
const confirmNextStatus = async () => {
  if (!selectedLog.value || !nextStatus.value) return;

  await fetch(
    `${import.meta.env.VITE_API_BASE}/visitor-status/${selectedLog.value.id}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        status: nextStatus.value,
      }),
    },
  );

  closeModal();
  await loadStatus(currentStatus.value, store.page);
};

const nextPage = () => loadStatus(currentStatus.value, store.page + 1);

const prevPage = () => {
  if (store.page > 1) {
    loadStatus(currentStatus.value, store.page - 1);
  }
};

// Auto refresh
let intervalId = null;

onMounted(() => {
  loadStatus();

  intervalId = setInterval(() => {
    loadStatus(currentStatus.value, store.page);
  }, 10000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
