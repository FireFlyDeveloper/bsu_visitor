<template>
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <!-- Office hero -->
      <section
        v-if="officeStore.office"
        class="surface-raised rise overflow-hidden"
      >
        <div class="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
          <div>
            <p class="eyebrow">Assigned office</p>
            <h1 class="font-display mt-2 text-4xl font-bold tracking-tight">
              {{ officeStore.office.office_name }}
            </h1>
            <p class="mt-1 text-sm text-[var(--ink-3)]">
              {{ officeStore.office.type || "Standard" }}
            </p>
            <div class="mt-6 flex flex-wrap items-center gap-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
                :class="statusTone(officeStore.office.status)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="statusDot(officeStore.office.status)"></span>
                {{ statusLabel(officeStore.office.status) }}
              </span>
              <span class="text-sm text-[var(--ink-3)]">
                · <span class="font-display font-semibold tabular text-[var(--ink)]">{{ officeStore.office.queue_count }}</span> in queue
              </span>
            </div>
          </div>

          <div>
            <p class="eyebrow">Change availability</p>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <button
                v-for="option in statusOptions"
                :key="option.value"
                type="button"
                class="btn"
                :class="officeStore.office.status === option.value ? 'btn-primary' : 'btn-secondary'"
                :disabled="officeStore.updatingStatus"
                @click="changeStatus(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
            <p
              v-if="officeStore.successMessage"
              class="mt-3 text-xs text-emerald-600"
            >
              {{ officeStore.successMessage }}
            </p>
          </div>
        </div>
      </section>

      <div v-else-if="officeStore.loading" class="surface p-8">
        <Skeleton height="120" />
      </div>
      <EmptyState
        v-else
        icon="users"
        title="No office assigned"
        description="Ask your administrator to link this staff account to an office."
      />

      <!-- Pending visitors -->
      <section class="surface p-6 lg:p-8">
        <div class="mb-5 flex items-end justify-between">
          <div>
            <p class="eyebrow">Visitors waiting</p>
            <p class="font-display mt-1 text-2xl font-bold tabular">
              {{ pendingTotal }}
              <span class="text-base font-normal text-[var(--ink-3)]">pending</span>
            </p>
          </div>
          <button
            class="btn btn-ghost btn-sm"
            :disabled="pendingLoading"
            @click="refreshPending"
          >
            {{ pendingLoading ? "Refreshing…" : "Refresh" }}
          </button>
        </div>

        <div v-if="pendingLoading && !pendingLogs.length" class="space-y-3">
          <Skeleton v-for="i in 3" :key="i" height="88" />
        </div>
        <EmptyState
          v-else-if="!pendingLogs.length"
          icon="coffee"
          title="No visitors waiting"
          description="When a new visitor is logged at the kiosk, they'll appear here."
        />

        <ul v-else class="space-y-3">
          <li
            v-for="(log, i) in pendingLogs"
            :key="log.id"
            :class="stagger(i)"
            class="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-3"
          >
            <img
              v-if="log.visitor_img"
              :src="visitorImageUrl(log.visitor_img)"
              class="h-16 w-16 rounded-2xl object-cover"
              alt=""
            />
            <div
              v-else
              class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--paper-2)] text-lg font-bold text-[var(--ink-2)]"
            >
              {{ (log.visitor_name || "?").charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ log.visitor_name }}</p>
              <p class="truncate text-xs text-[var(--ink-3)]">
                {{ log.purpose || "—" }} · {{ log.contact_number || "no contact" }}
              </p>
              <p class="mt-0.5 font-mono text-[0.6875rem] tabular text-[var(--ink-3)]">
                logged in {{ formatTime(log.time_in) }}
              </p>
            </div>
            <AppButton
              variant="success"
              size="sm"
              :loading="marking === log.id"
              :disabled="marking === log.id"
              @click="markDone(log)"
            >
              Mark done
            </AppButton>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useOfficeStore } from "@/store/office.js";
import { useVisitorLogStore } from "@/store/visitorLog.js";
import { useToast } from "@/composables/useToast";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { stagger } from "@/composables/useStagger";
import { visitorImageUrl } from "@/utils/visitorImageUrl";
import { formatServerTime } from "@/utils/dateTime";

const officeStore = useOfficeStore();
const visitorLogStore = useVisitorLogStore();
const toast = useToast();

const pendingLogs = ref([]);
const pendingTotal = ref(0);
const pendingLoading = ref(false);
const marking = ref(null);

const statusOptions = [
  { label: "Available", value: "available" },
  { label: "Busy", value: "busy" },
  { label: "Not available", value: "not available" },
];

function statusLabel(s) {
  const v = (s || "available").toLowerCase();
  if (v === "not available") return "Not available";
  return v[0].toUpperCase() + v.slice(1);
}
function statusTone(s) {
  const v = (s || "").toLowerCase();
  if (v === "available") return "bg-emerald-50 text-emerald-700";
  if (v === "busy") return "bg-amber-50 text-amber-700";
  if (v === "not available") return "bg-rose-50 text-rose-700";
  return "bg-[var(--paper-2)] text-[var(--ink-2)]";
}
function statusDot(s) {
  const v = (s || "").toLowerCase();
  if (v === "available") return "bg-emerald-500";
  if (v === "busy") return "bg-amber-500";
  if (v === "not available") return "bg-rose-500";
  return "bg-slate-400";
}

async function refreshPending() {
  pendingLoading.value = true;
  try {
    const data = await visitorLogStore.fetchPendingVisitLogs({ perPage: 20 });
    pendingLogs.value = data.data || data.logs || [];
    pendingTotal.value = data.total ?? pendingLogs.value.length;
  } catch (err) {
    console.error(err);
  } finally {
    pendingLoading.value = false;
  }
}

async function markDone(log) {
  marking.value = log.id;
  try {
    await visitorLogStore.markDone(log.id);
    toast.success(`${log.visitor_name} marked done`);
    await Promise.all([
      refreshPending(),
      officeStore.fetchOfficeDashboard(),
    ]);
  } catch (err) {
    toast.error(err?.message || "Could not mark done");
  } finally {
    marking.value = null;
  }
}

async function changeStatus(status) {
  try {
    await officeStore.updateOfficeStatus(status);
  } catch (err) {
    toast.error(err?.message || "Could not change status");
  }
}

function formatTime(value) {
  return formatServerTime(value);
}

onMounted(async () => {
  await officeStore.fetchOfficeDashboard();
  await refreshPending();
});
</script>
