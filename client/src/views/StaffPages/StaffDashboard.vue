<template>
  <section class="space-y-6">
    <!-- HEADER -->
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Staff Dashboard</h1>
      <p class="mt-2 text-slate-600">
        Manage your office availability and monitor the current visitor queue.
      </p>
    </div>

    <!-- ERROR -->
    <div
      v-if="officeStore.error"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ officeStore.error }}
    </div>

    <!-- LOADING -->
    <div
      v-if="officeStore.loading"
      class="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm"
    >
      Loading office dashboard...
    </div>

    <!-- OFFICE DATA -->
    <div
      v-else-if="officeStore.office"
      class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        
        <!-- LEFT INFO -->
        <div class="space-y-4">
          <div>
            <p class="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Assigned Office
            </p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">
              {{ officeStore.office.office_name }}
            </h2>
            <p class="mt-1 text-slate-600">
              Type: {{ officeStore.office.type || "Not set" }}
            </p>
          </div>

          <div class="flex flex-wrap gap-4">
            <div class="rounded-2xl bg-slate-100 px-4 py-3">
              <p class="text-sm text-slate-500">Current status</p>
              <p class="mt-1 font-semibold capitalize text-slate-900">
                {{ officeStore.office.status || "available" }}
              </p>
            </div>

            <div class="rounded-2xl bg-slate-100 px-4 py-3">
              <p class="text-sm text-slate-500">Visitors in queue</p>
              <p class="mt-1 text-2xl font-bold text-slate-900">
                {{ officeStore.office.queue_count }}
              </p>
            </div>
          </div>
        </div>

        <!-- RIGHT ACTIONS -->
        <div class="w-full max-w-xl space-y-3">
          <p class="text-sm font-medium text-slate-700">
            Change office status
          </p>

          <div class="grid gap-3 sm:grid-cols-3">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              class="rounded-2xl px-4 py-3 text-sm font-semibold transition"
              :class="getStatusButtonClass(option.value)"
              :disabled="officeStore.updatingStatus"
              @click="changeStatus(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <p
            v-if="officeStore.successMessage"
            class="text-sm text-emerald-600"
          >
            {{ officeStore.successMessage }}
          </p>
        </div>
      </div>
    </div>

    <!-- NO OFFICE -->
    <div
      v-else
      class="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm"
    >
      No office is assigned to this staff account yet.
    </div>

    <!-- PENDING VISITORS -->
    <div
      v-if="pendingLogs.length"
      class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Visitors waiting</h2>
          <p class="text-xs text-slate-500">
            {{ pendingLogs.length }} pending
          </p>
        </div>
        <button
          @click="refreshPending"
          :disabled="pendingLoading"
          class="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-50"
        >
          {{ pendingLoading ? "Refreshing..." : "Refresh" }}
        </button>
      </div>
      <ul class="space-y-3">
        <li
          v-for="log in pendingLogs"
          :key="log.id"
          class="flex items-center gap-4 rounded-2xl bg-slate-50 p-3"
        >
          <img
            v-if="log.visitor_img"
            :src="`/${log.visitor_img}`"
            class="h-14 w-14 rounded-full object-cover border border-slate-200"
            alt="Visitor"
          />
          <div
            v-else
            class="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700"
          >
            {{ (log.visitor_name || "?").charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-slate-900">{{ log.visitor_name }}</p>
            <p class="truncate text-xs text-slate-500">
              {{ log.purpose || "—" }} · {{ log.contact_number || "no contact" }}
            </p>
            <p class="text-xs text-slate-400">
              Logged in {{ formatTime(log.time_in) }}
            </p>
          </div>
          <button
            @click="markDone(log)"
            :disabled="marking === log.id"
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {{ marking === log.id ? "..." : "Mark done" }}
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useOfficeStore } from "../../store/office.js";
import { useVisitorLogStore } from "../../store/visitorLog.js";

const officeStore = useOfficeStore();
const visitorLogStore = useVisitorLogStore();

const pendingLogs = ref([]);
const pendingLoading = ref(false);
const marking = ref(null);

const statusOptions = [
  { label: "Available", value: "available" },
  { label: "Busy", value: "busy" },
  { label: "Not Available", value: "not available" },
];

async function refreshPending() {
  pendingLoading.value = true;
  try {
    const data = await visitorLogStore.fetchPendingVisitLogs({ perPage: 20 });
    pendingLogs.value = data.data || data.logs || [];
  } catch (err) {
    console.error("refreshPending error:", err);
  } finally {
    pendingLoading.value = false;
  }
}

async function markDone(log) {
  marking.value = log.id;
  try {
    await visitorLogStore.markDone(log.id);
    await refreshPending();
  } catch (err) {
    console.error("markDone error:", err);
  } finally {
    marking.value = null;
  }
}

function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString();
}

// Fetch data on load
onMounted(async () => {
  await officeStore.fetchOfficeDashboard();
  await refreshPending();
});

// Update status using store
function changeStatus(status) {
  officeStore.updateOfficeStatus(status);
}

// Button styles
function getStatusButtonClass(status) {
  const isActive = officeStore.office?.status === status;

  return isActive
    ? "bg-slate-900 text-white shadow-sm"
    : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50";
}
</script>