<template>
  <div class="min-h-[100dvh] bg-[#fbfaf7] text-[var(--bsu-ink)]">
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-[var(--bsu-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--bsu-red)]"
          >
            <Building2 class="h-3.5 w-3.5" aria-hidden="true" />
            Campus directory
          </div>
          <h1 class="font-display mt-4 text-3xl font-bold tracking-tight">
            Office directory
          </h1>
          <p class="mt-1 max-w-xl text-sm text-[var(--bsu-ink-2)]">
            Live availability and wait times across campus offices. Select an
            office to register your visit or get directions.
          </p>
        </div>
        <router-link
          to="/register"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--bsu-red)] px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.01] hover:bg-[#a30e22]"
        >
          Register a visit →
        </router-link>
      </header>

      <main class="mt-8">
        <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="i in 6"
            :key="i"
            class="h-40 animate-pulse rounded-3xl border border-[var(--bsu-line)] bg-white p-5"
          >
            <div class="h-4 w-2/3 rounded-full bg-[var(--bsu-paper-2)]" />
            <div class="mt-4 h-3 w-1/2 rounded-full bg-[var(--bsu-paper-2)]" />
            <div class="mt-6 h-9 w-full rounded-xl bg-[var(--bsu-paper-2)]" />
          </div>
        </div>

        <div
          v-else-if="!offices.length"
          class="rounded-3xl border-2 border-dashed border-[var(--bsu-line)] p-10 text-center"
        >
          <p class="text-4xl">🏛️</p>
          <h2 class="font-display mt-3 text-xl font-bold">No offices available</h2>
          <p class="mt-1 text-sm text-[var(--bsu-ink-2)]">
            Please check back later or ask the guard for help.
          </p>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="o in offices"
            :key="o.id"
            class="flex flex-col rounded-3xl border border-[var(--bsu-line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="font-display truncate text-lg font-bold uppercase tracking-wide">
                  {{ o.office_name }}
                </h2>
                <p class="mt-1 text-xs font-semibold uppercase tracking-wider" :class="o.status === 'available' ? 'text-emerald-600' : 'text-slate-500'">
                  {{ o.status === "available" ? "Open for visitors" : o.status || "Unknown" }}
                </p>
              </div>
            </div>

            <p class="mt-4 text-sm text-[var(--bsu-ink-2)]">
              <span class="font-display text-2xl font-bold text-[var(--bsu-red)]">{{ o.queue_count ?? 0 }}</span>
              &nbsp;currently waiting
            </p>

            <div class="mt-5 flex gap-2">
              <router-link
                :to="{ path: '/register', query: { office: o.id } }"
                class="flex-1 rounded-xl bg-[var(--bsu-red)] px-3 py-2.5 text-center text-sm font-bold text-white transition hover:bg-[#a30e22]"
              >
                Register
              </router-link>
              <router-link
                v-if="canNavigate(o)"
                :to="{ path: '/navigate', query: { to: o.id, name: o.office_name } }"
                class="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border-2 border-[var(--bsu-red)] px-3 py-2.5 text-sm font-bold text-[var(--bsu-red)] transition hover:bg-[var(--bsu-red-soft)]"
              >
                Navigate
              </router-link>
            </div>
          </div>
        </div>
      </main>

      <footer class="mt-10 rounded-3xl border border-[var(--bsu-line)] bg-white p-4 text-xs leading-5 text-[var(--bsu-ink-2)]">
        Queue counts are live estimates only. Your personal details are never
        shown publicly.
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { Building2 } from "@lucide/vue";
import { findArDestination } from "@/config/arNavigation";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const offices = ref([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/public/directory`);
    if (res.ok) {
      const data = await res.json();
      offices.value = Array.isArray(data) ? data : (data.offices || []);
    }
  } catch (_) {
    /* empty list */
  } finally {
    loading.value = false;
  }
}

function canNavigate(office) {
  return !!findArDestination({ id: office.id, name: office.office_name });
}

onMounted(load);
</script>

<style scoped>
.font-display {
  font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
}
</style>
