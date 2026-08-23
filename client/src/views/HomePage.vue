<template>
  <div class="min-h-screen bg-[#fffaf8] text-[var(--bsu-ink)]">
    <main>
      <!-- Hero — campus photo with red overlay, matching the login design -->
      <section class="relative overflow-hidden bg-[#6f0b18] text-white">
        <img
          src="/img/bsu_outside.png"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-gradient-to-tr from-[var(--bsu-red)]/95 via-[var(--bsu-red)]/75 to-[var(--bsu-red)]/40"
          aria-hidden="true"
        ></div>
        <div class="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-24">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur">Welcome to Batangas State University</p>
            <h1 class="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-6xl">Your campus visit, clearly guided.</h1>
            <p class="mt-5 max-w-xl text-lg leading-relaxed text-white/90">Find an office, join a visitor queue, and keep your visit status in one place.</p>
            <div class="mt-8 grid gap-3 sm:grid-cols-2">
              <router-link
                to="/register"
                class="group flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-bold text-[var(--bsu-red)] shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:bg-[#fff5f3]"
              >
                <ClipboardList class="h-5 w-5 transition group-hover:scale-110" aria-hidden="true" />
                Register as Visitor
              </router-link>
              <router-link
                to="/directory"
                class="flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-4 text-base font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                <Building2 class="h-5 w-5" aria-hidden="true" />
                Find an Office
              </router-link>
              <router-link
                to="/status"
                class="flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-4 text-base font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                <Search class="h-5 w-5" aria-hidden="true" />
                Check Visitor Status
              </router-link>
              <router-link
                to="/office"
                class="flex items-center justify-center gap-2 rounded-2xl bg-[#16060a]/35 px-6 py-4 text-base font-bold text-white ring-1 ring-inset ring-white/25 transition hover:-translate-y-0.5 hover:bg-[#16060a]/50"
              >
                <Camera class="h-5 w-5" aria-hidden="true" />
                AR Navigation
              </router-link>
            </div>
          </div>
          <div class="rounded-3xl bg-white p-6 text-[var(--bsu-ink)] shadow-[0_30px_80px_rgba(0,0,0,0.35)] ring-1 ring-black/5 sm:p-8">
            <p class="inline-flex items-center gap-2 rounded-full bg-[var(--bsu-red-soft)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--bsu-red)]">
              <span class="relative flex h-2.5 w-2.5">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              Live · Campus occupancy
            </p>
            <p class="mt-4 text-6xl font-bold tabular-nums text-[var(--bsu-red)]">{{ occupancy }}</p>
            <p class="mt-1 text-sm text-[var(--bsu-ink-2)]">visitors currently on campus</p>
            <div class="mt-6 rounded-2xl bg-[#fbfaf7] p-4 ring-1 ring-[var(--bsu-line)]">
              <p class="text-sm font-semibold">Plan your visit before you arrive</p>
              <p class="mt-2 text-sm leading-6 text-[var(--bsu-ink-2)]">Queue counts and estimated waits are anonymous. Personal details are collected only when you register.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Live directory -->
      <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="mb-7 flex items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Live directory</p>
            <h2 class="mt-2 text-3xl font-bold">Where do you need to go?</h2>
          </div>
          <router-link to="/directory" class="rounded-xl bg-[var(--bsu-red)] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#a30e22]">View all offices</router-link>
        </div>
        <div v-if="loading" class="text-sm text-[var(--bsu-ink-2)]">Loading office availability...</div>
        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="office in offices.slice(0, 6)" :key="office.id" class="surface group flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div class="flex items-start justify-between gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--bsu-red-soft)] text-[var(--bsu-red)]">
                <Building2 class="h-5 w-5" aria-hidden="true" />
              </div>
              <span class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{{ office.status }}</span>
            </div>
            <h3 class="mt-4 text-lg font-bold">{{ capitalizeName(office.office_name) }}</h3>
            <p class="mt-2 flex items-center gap-1.5 text-sm text-[var(--bsu-ink-2)]">
              <Clock class="h-4 w-4 text-amber-500" aria-hidden="true" />
              {{ office.queue_count }} in queue<template v-if="office.estimated_wait_minutes != null"> · about {{ office.estimated_wait_minutes }} min wait</template>
            </p>
            <router-link
              :to="`/register?office=${office.id}`"
              class="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--bsu-red-soft)] px-4 py-2.5 text-sm font-bold text-[var(--bsu-red)] transition hover:bg-[var(--bsu-red)] hover:text-white"
            >
              Register here
              <ArrowRight class="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </router-link>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { ArrowRight, Building2, Camera, ClipboardList, Clock, Search } from "@lucide/vue";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const offices = ref([]);
const occupancy = ref(0);
const loading = ref(true);
let pollTimer = null;

function capitalizeName(name) {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : name;
}

async function loadDirectory() {
  try {
    const response = await fetch(`${API_BASE}/public/directory`);
    const data = await response.json();
    offices.value = data.offices || [];
    occupancy.value = data.occupancy?.active_visitors || 0;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadDirectory();
  // Keep the LIVE badge honest: refresh occupancy + queue counts every 30s.
  pollTimer = setInterval(loadDirectory, 30_000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>
