<template>
  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
            Visitor Logs
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Complete history of all visitor transactions
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
            Live data
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="visitorLogStore.error"
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
          <p class="text-sm text-red-700">{{ visitorLogStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div
      class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <!-- Loading Overlay -->
      <div v-if="visitorLogStore.loading" class="relative">
        <div
          class="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <div class="flex flex-col items-center gap-2">
            <div
              class="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin"
            ></div>
            <span class="text-sm text-slate-500">Loading logs...</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!visitorLogStore.loading && visitorLogStore.logs.length === 0"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p class="text-slate-500 font-medium">No visitor logs found</p>
        <p class="text-sm text-slate-400 mt-1">
          All visitor records will appear here
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/50">
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Time In
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Visitor
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Office
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Purpose
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Time Out
              </th>
              <th class="px-6 py-3.5 text-center font-semibold text-slate-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="log in visitorLogStore.logs"
              :key="log.id"
              class="group transition-all duration-150 hover:bg-slate-50"
            >
              <td class="whitespace-nowrap px-6 py-4">
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
                  <span class="text-slate-600">{{
                    formatDateTime(log.time_in)
                  }}</span>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-linear-to-br from-red-100 to-red-50 flex items-center justify-center"
                  >
                    <span class="text-red-700 font-medium text-xs">
                      {{ log.visitor_name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <div class="font-semibold text-slate-800 capitalize">
                      {{ log.visitor_name }}
                    </div>
                    <div class="text-xs text-slate-500">
                      {{ log.contact_number }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-600 capitalize">{{
                    log.office_name
                  }}</span>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="max-w-xs text-slate-600 truncate capitalize">
                  {{ log.purpose || "-" }}
                </div>
              </td>

              <td class="px-6 py-4">
                <div v-if="log.time_out" class="flex items-center gap-1.5">
                  <svg
                    class="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M17 7l-5 5m0 0l-5-5m5 5V3"
                    />
                  </svg>
                  <span class="text-slate-600">{{
                    formatDateTime(log.time_out)
                  }}</span>
                </div>
                <div v-else class="flex items-center gap-1.5">
                  <span class="relative flex h-2 w-2">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
                    ></span>
                  </span>
                  <span class="text-sm font-medium text-green-600">Active</span>
                </div>
              </td>

              <td class="px-6 py-4 text-center">
                <button
                  @click="handleDelete(log.id)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modern Pagination -->
    <div class="mt-6 flex items-center justify-between">
      <div class="text-sm text-slate-500">
        Page
        <span class="font-medium text-slate-700">{{
          visitorLogStore.page || 1
        }}</span>
      </div>

      <div class="flex gap-2">
        <button
          @click="prevPage"
          :disabled="visitorLogStore.page <= 1 || visitorLogStore.loading"
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
          :disabled="visitorLogStore.loading"
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

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeDeleteModal"
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
                Delete Visitor Log
              </h2>
              <button
                @click="closeDeleteModal"
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
              <div class="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <div
                  class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-slate-800">
                    {{ selectedLog.visitor_name }}
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ selectedLog.office_name }}
                  </p>
                </div>
              </div>

              <p class="text-slate-600">
                Are you sure you want to delete this visitor log? This action
                cannot be undone.
              </p>
            </div>

            <div class="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                @click="closeDeleteModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                @click="confirmDelete"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useVisitorLogStore } from "../../store/visitorLog";

const visitorLogStore = useVisitorLogStore();

// Modal state
const showDeleteModal = ref(false);
const selectedLog = ref(null);
const deleteId = ref(null);

// Fetch logs on page load
const getLogs = async () => {
  try {
    await visitorLogStore.fetchVisitLogs({
      page: visitorLogStore.page || 1,
      perPage: visitorLogStore.perPage || 10,
    });
  } catch (error) {
    console.error(error);
  }
};

// Pagination
const nextPage = async () => {
  if (visitorLogStore.loading) return;
  visitorLogStore.page = (visitorLogStore.page || 1) + 1;
  await getLogs();
};

const prevPage = async () => {
  if (visitorLogStore.loading || (visitorLogStore.page || 1) <= 1) return;
  visitorLogStore.page = (visitorLogStore.page || 1) - 1;
  await getLogs();
};

// Delete handler with modal
const handleDelete = (id) => {
  const log = visitorLogStore.logs.find((l) => l.id === id);
  if (log) {
    selectedLog.value = log;
    deleteId.value = id;
    showDeleteModal.value = true;
  }
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedLog.value = null;
  deleteId.value = null;
};

const confirmDelete = async () => {
  if (!deleteId.value) return;

  try {
    await visitorLogStore.deleteLog(deleteId.value);
    closeDeleteModal();
    await getLogs(); // refresh after delete
  } catch (error) {
    alert(error.message || "Failed to delete log");
    closeDeleteModal();
  }
};

// Format date
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

// Load logs when component mounts
onMounted(() => {
  getLogs();
});
</script>
