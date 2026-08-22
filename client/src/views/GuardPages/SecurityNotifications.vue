<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <!-- Header -->
    <header class="flex flex-col gap-1">
      <p class="eyebrow text-xs font-bold uppercase tracking-widest text-[var(--bsu-red)]">Security</p>
      <h1 class="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
      <p class="text-sm text-slate-500">
        Campus-relevant visitor events for the security desk. Newest first.
      </p>
    </header>

    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {{ loading ? "Loading events" : `${events.length} recent events` }}
        </p>
        <button
          class="text-xs font-semibold text-[var(--bsu-red)] hover:underline disabled:opacity-40"
        :disabled="loading"
          @click="load"
        >
          ↻ Refresh
        </button>
      </div>

      <div v-if="loading" class="space-y-2 p-6">
        <Skeleton v-for="i in 4" :key="i" height="52" />
      </div>

      <EmptyState
        v-else-if="!events.length"
        icon="bell"
        title="No notifications yet"
        description="New visitor registrations will appear here."
      />

      <ul v-else class="divide-y divide-slate-100">
        <li v-for="ev in events" :key="ev.id" class="flex items-start gap-4 px-6 py-4">
          <span
            class="mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide"
            :class="tone(ev.event_type)"
          >
            {{ prettyType(ev.event_type) }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-800">{{ headline(ev) }}</p>
            <p v-if="detail(ev)" class="mt-0.5 truncate text-xs text-slate-500">{{ detail(ev) }}</p>
          </div>
          <time class="shrink-0 font-mono text-[0.6875rem] tabular text-slate-400">
            {{ formatServerDateTime(ev.created_at) }}
          </time>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { formatServerDateTime } from "@/utils/dateTime";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const loading = ref(true);
const events = ref([]);

function tone(type) {
  const v = (type || "").toLowerCase();
  if (v.includes("overdue")) return "bg-red-100 text-red-700";
  if (v.includes("sign") || v.includes("out")) return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function prettyType(type) {
  return (type || "event").replace(/[_-]+/g, " ");
}

function headline(ev) {
  const p = ev.payload || {};
  return p.title || p.message || p.headline || prettyType(ev.event_type);
}

function detail(ev) {
  const p = ev.payload || {};
  return p.detail || p.body || p.office_name || p.reference_number || "";
}

async function load() {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/mvp/notification-events`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      events.value = Array.isArray(data.events) ? data.events : [];
    }
  } catch (_) {
    /* leave list empty — never fabricate events */
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
