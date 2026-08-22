<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <!-- Header -->
    <header class="flex flex-col gap-1">
      <p class="eyebrow text-xs font-bold uppercase tracking-widest text-[var(--bsu-red)]">Security</p>
      <h1 class="text-3xl font-bold tracking-tight text-slate-900">Campus overview</h1>
      <p class="text-sm text-slate-500">
        Live snapshot of visitors on campus, pending sign-outs, and overdue cases.
      </p>
    </header>

    <!-- Stat cards -->
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="card in cards"
        :key="card.label"
        class="rounded-3xl border p-5 shadow-sm transition"
        :class="card.accent"
      >
        <p class="text-xs font-bold uppercase tracking-wider" :class="card.labelTone">{{ card.label }}</p>
        <p class="mt-2 text-4xl font-bold tabular tracking-tight text-slate-900">
          <span v-if="loading" class="inline-block h-9 w-14 animate-pulse rounded-lg bg-slate-200" />
          <template v-else>{{ card.value }}</template>
        </p>
        <p class="mt-1 text-xs text-slate-500">{{ card.hint }}</p>
      </div>
    </section>

    <!-- Pending sign-out preview -->
    <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-500">Pending sign-out</h2>
        <router-link to="/security/visitors/status" class="text-xs font-semibold text-[var(--bsu-red)] hover:underline">
          Open Active &amp; sign-out →
        </router-link>
      </div>
      <div v-if="loading" class="space-y-2 p-6">
        <Skeleton height="40" />
        <Skeleton height="40" />
      </div>
      <EmptyState
        v-else-if="!pending.length"
        icon="check"
        title="No pending sign-outs"
        description="Every completed visit has been signed out."
      />
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="row in pending.slice(0, 5)" :key="row.id" class="flex items-center justify-between gap-4 px-6 py-3.5">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold uppercase text-slate-600">
              {{ (row.visitor_name || "?").charAt(0) }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-800">{{ row.visitor_name }}</p>
              <p class="truncate text-xs text-slate-500">{{ row.office_name }}</p>
            </div>
          </div>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide"
            :class="row.overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'"
          >
            {{ row.overdue ? "Overdue" : "Awaiting" }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Quick actions -->
    <section class="grid gap-4 sm:grid-cols-2">
      <router-link
        to="/security/kiosk"
        class="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--bsu-red)]/50 hover:shadow-md"
      >
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--bsu-red-soft)] text-[var(--bsu-red)] transition-colors duration-200 group-hover:bg-[var(--bsu-red)] group-hover:text-white"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16.5 3.75v6a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5v-6M9 11.25h3M12 15v-3.75M15.75 21a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
            <path d="M16.5 6.75h3a1.5 1.5 0 0 1 1.5 1.5V18a3 3 0 0 1-3 3h-1.5" />
          </svg>
        </span>
        <span class="min-w-0">
          <span class="block font-semibold text-slate-900">Register a walk-in visitor</span>
          <span class="mt-0.5 block text-xs leading-5 text-slate-500">Assisted registration at the security kiosk</span>
        </span>
        <svg
          class="ml-auto h-5 w-5 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--bsu-red)]"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </router-link>

      <router-link
        to="/security/offices/status"
        class="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors duration-200 group-hover:bg-slate-700 group-hover:text-white"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V20M15 10h3.5A1.5 1.5 0 0 1 20 11.5V20M2.5 20h19M8 8h.01M11 8h.01M8 12h.01M11 12h.01M8 16h.01M17.5 14h.01M17.5 17h.01" />
          </svg>
        </span>
        <span class="min-w-0">
          <span class="block font-semibold text-slate-900">Office availability</span>
          <span class="mt-0.5 block text-xs leading-5 text-slate-500">Live status of every campus office</span>
        </span>
        <svg
          class="ml-auto h-5 w-5 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-slate-600"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </router-link>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useVisitorLogStore } from "@/store/visitorLog";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const visitorLogStore = useVisitorLogStore();

const loading = ref(true);
const activeCount = ref(0);
const pending = ref([]);
const overdueCount = ref(0);

const cards = computed(() => [
  {
    label: "On campus now",
    value: activeCount.value,
    hint: "Checked in, not yet signed out",
    accent: "border-emerald-200 bg-emerald-50/60",
    labelTone: "text-emerald-700",
  },
  {
    label: "Pending sign-out",
    value: pending.value.length,
    hint: "Completed visits awaiting exit",
    accent: "border-amber-200 bg-amber-50/60",
    labelTone: "text-amber-700",
  },
  {
    label: "Overdue",
    value: overdueCount.value,
    hint: "Past their exit deadline",
    accent: "border-red-200 bg-red-50/60",
    labelTone: "text-red-700",
  },
]);

async function load() {
  loading.value = true;
  try {
    const [activeRes, pendingRes] = await Promise.all([
      fetch(`${API_BASE}/security-guard/visitors/active`, { credentials: "include" }),
      fetch(`${API_BASE}/security-guard/visitors/pending-sign-out`, { credentials: "include" }),
    ]);
    if (activeRes.ok) {
      const data = await activeRes.json();
      activeCount.value = Number(data.total ?? data.length ?? 0);
    }
    if (pendingRes.ok) {
      const data = await pendingRes.json();
      pending.value = Array.isArray(data.data) ? data.data : [];
    }
    const overdue = await visitorLogStore.fetchOverdue();
    overdueCount.value = Number(overdue?.total || 0);
  } catch (_) {
    /* keep zeroes — dashboard stays honest */
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
