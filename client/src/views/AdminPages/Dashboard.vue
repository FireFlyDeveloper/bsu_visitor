<template>
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <!-- Header -->
      <header class="rise mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Administrator</p>
          <h1 class="mt-2 text-4xl font-bold tracking-tight">Dashboard</h1>
          <p class="lede mt-2 max-w-xl">
            Live overview of offices, users, and visitor activity across the
            campus. Last refreshed {{ lastRefreshed }}.
          </p>
        </div>
        <AppButton variant="secondary" :loading="refreshing" @click="refreshAll">
          Refresh
        </AppButton>
      </header>

      <!-- Bento grid: asymmetric -->
      <div class="grid gap-4 lg:grid-cols-12">
        <!-- KPI: Offices (wide) -->
        <div class="surface rise p-6 lg:col-span-7 lg:p-8">
          <div class="flex items-start justify-between">
            <div>
              <p class="eyebrow">Offices</p>
              <p class="mt-2 text-xs text-[var(--ink-3)]">
                Live state of every registered office
              </p>
            </div>
            <router-link
              to="/admin/offices"
              class="text-xs font-semibold text-[var(--brand)] hover:underline"
              >Manage →</router-link
            >
          </div>
          <div v-if="officeStore.fetchingOffices && !officesForCards.length" class="mt-6 grid gap-3 sm:grid-cols-2">
            <Skeleton v-for="i in 4" :key="i" height="76" />
          </div>
          <div v-else-if="!officesForCards.length" class="mt-6">
            <EmptyState icon="users" title="No offices" description="Add offices to start tracking visitors." />
          </div>
          <div v-else class="mt-6 grid gap-3 sm:grid-cols-2">
            <div
              v-for="(o, i) in officesForCards"
              :key="o.id"
              :class="stagger(i)"
              class="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3"
            >
              <div class="min-w-0">
                <p class="truncate font-semibold">{{ o.office_name }}</p>
                <p class="truncate text-xs text-[var(--ink-3)]">
                  {{ o.type || "Standard" }}
                </p>
              </div>
              <span
                class="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="statusTone(o.status)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="statusDot(o.status)"></span>
                {{ statusLabel(o.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- KPI: Users by role (narrow) -->
        <div class="surface rise rise-delay-1 p-6 lg:col-span-5 lg:p-8">
          <div class="flex items-start justify-between">
            <div>
              <p class="eyebrow">Users</p>
              <p class="mt-2 text-xs text-[var(--ink-3)]">Active accounts</p>
            </div>
            <router-link
              to="/admin/users"
              class="text-xs font-semibold text-[var(--brand)] hover:underline"
              >Manage →</router-link
            >
          </div>
          <p class="font-display mt-6 text-5xl font-bold tabular tracking-tight">
            {{ userStore.users.length }}
          </p>
          <ul class="mt-6 space-y-3">
            <li
              v-for="(row, i) in roleBreakdown"
              :key="row.role_id"
              :class="stagger(i)"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ row.label }}</span>
                <span class="tabular text-[var(--ink-2)]">{{ row.count }}</span>
              </div>
              <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--paper-2)]">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :class="row.barClass"
                  :style="{ width: row.percent + '%' }"
                />
              </div>
            </li>
          </ul>
        </div>

        <!-- KPI: Visits today (small) -->
        <div class="surface rise rise-delay-2 flex flex-col items-center justify-center p-6 text-center lg:col-span-3">
          <p class="eyebrow">Visits today</p>
          <p class="font-display mt-3 text-4xl font-bold tabular tracking-tight">
            {{ kpi.visitsToday }}
          </p>
          <p class="mt-1 text-xs text-[var(--ink-3)]">vs {{ kpi.visitsYesterday }} yesterday</p>
        </div>

        <!-- KPI: Offices available (small) -->
        <div class="surface rise rise-delay-2 flex flex-col items-center justify-center p-6 text-center lg:col-span-3">
          <p class="eyebrow">Open now</p>
          <p class="font-display mt-3 text-4xl font-bold tabular tracking-tight text-emerald-700">
            {{ kpi.officesAvailable }}
            <span class="text-base font-normal text-[var(--ink-3)]">/ {{ kpi.offices }}</span>
          </p>
          <p class="mt-1 text-xs text-[var(--ink-3)]">offices available</p>
        </div>

        <!-- Recent activity (timeline) -->
        <div class="surface rise rise-delay-3 p-6 lg:col-span-6 lg:p-8">
          <div class="flex items-start justify-between">
            <div>
              <p class="eyebrow">Recent activity</p>
              <p class="mt-2 text-xs text-[var(--ink-3)]">
                Last {{ recentVisits.length }} visitor logs
              </p>
            </div>
            <router-link
              to="/visitors/logs"
              class="text-xs font-semibold text-[var(--brand)] hover:underline"
              >All logs →</router-link
            >
          </div>

          <div
            v-if="visitorLogStore.loading && !recentVisits.length"
            class="mt-6 space-y-3"
          >
            <Skeleton v-for="i in 5" :key="i" height="56" />
          </div>
          <div v-else-if="!recentVisits.length" class="mt-6">
            <EmptyState
              icon="coffee"
              title="No visitor activity yet"
              description="The dashboard will light up once visitors are logged at the kiosk."
            />
          </div>
          <ol v-else class="mt-6 space-y-4">
            <li
              v-for="(log, i) in recentVisits"
              :key="log.id"
              :class="stagger(i)"
              class="flex gap-4"
            >
              <div class="relative flex flex-col items-center">
                <div
                  class="h-9 w-9 shrink-0 rounded-full bg-[var(--paper-2)] ring-4 ring-white"
                />
                <span
                  v-if="i < recentVisits.length - 1"
                  class="absolute top-9 h-full w-px bg-[var(--line)]"
                />
              </div>
              <div class="min-w-0 flex-1 pb-2">
                <div class="flex items-baseline justify-between gap-2">
                  <p class="truncate font-semibold">
                    {{ log.visitor_name || "Visitor" }}
                  </p>
                  <span class="shrink-0 font-mono text-[0.6875rem] tabular text-[var(--ink-3)]">
                    {{ formatTime(log.time_in) }}
                  </span>
                </div>
                <p class="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
                  <span class="font-medium text-[var(--ink-2)]">{{ log.office_name }}</span>
                  <span>·</span>
                  <span class="truncate">{{ log.purpose || "—" }}</span>
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useOfficeStore } from "@/store/office.js";
import { useUserStore } from "@/store/user.js";
import { useVisitorLogStore } from "@/store/visitorLog.js";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { stagger } from "@/composables/useStagger";
import { parseServerDate, formatServerDateTime } from "@/utils/dateTime";

const officeStore = useOfficeStore();
const userStore = useUserStore();
const visitorLogStore = useVisitorLogStore();

const refreshing = ref(false);
const lastRefreshed = ref("just now");

const officesForCards = computed(() => officeStore.offices || []);

const kpi = computed(() => {
  const offices = officesForCards.value;
  const visits = visitorLogStore.logs || [];
  const todayKey = new Date().toDateString();
  const yesterdayKey = new Date(Date.now() - 86400000).toDateString();
  return {
    offices: offices.length,
    officesAvailable: offices.filter(
      (o) => (o.status || "available").toLowerCase() === "available",
    ).length,
    visitsToday: visits.filter((v) => {
      const ts = v.time_in || v.created_at;
      return ts && parseServerDate(ts)?.toDateString() === todayKey;
    }).length,
    visitsYesterday: visits.filter((v) => {
      const ts = v.time_in || v.created_at;
      return ts && parseServerDate(ts)?.toDateString() === yesterdayKey;
    }).length,
  };
});

const ROLE_META = {
  1: { label: "Administrators", barClass: "bg-rose-500" },
  2: { label: "Security", barClass: "bg-sky-500" },
  3: { label: "Staff", barClass: "bg-emerald-500" },
};

const roleBreakdown = computed(() => {
  const users = userStore.users || [];
  const total = users.length || 1;
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const u of users) {
    if (counts[u.role_id] !== undefined) counts[u.role_id] += 1;
  }
  return Object.keys(counts).map((id) => {
    const meta = ROLE_META[id];
    return {
      role_id: Number(id),
      label: meta.label,
      count: counts[id],
      barClass: meta.barClass,
      percent: Math.round((counts[id] / total) * 100),
    };
  });
});

const recentVisits = computed(() => (visitorLogStore.logs || []).slice(0, 8));

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

function formatTime(value) {
  return formatServerDateTime(value);
}

async function refreshAll() {
  refreshing.value = true;
  try {
    await Promise.allSettled([
      officeStore.fetchOffices(),
      userStore.fetchAllUsers(),
      visitorLogStore.fetchVisitLogs({ perPage: 200, page: 1 }),
    ]);
    lastRefreshed.value = "just now";
  } finally {
    refreshing.value = false;
  }
}

onMounted(refreshAll);
</script>
