<template>
  <div class="min-h-screen bg-[#fffaf8] text-[var(--bsu-ink)]">
    <main>
      <section class="border-b-4 border-[var(--bsu-red)] bg-[var(--bsu-red)] text-white">
        <div class="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-24">
          <div>
            <p class="eyebrow text-white/75">Batangas State University</p>
            <h1 class="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Your campus visit, clearly guided.</h1>
            <p class="mt-5 max-w-xl text-lg leading-relaxed text-white/85">Find an office, join a visitor queue, and keep your visit status in one place.</p>
            <div class="mt-8 grid gap-3 sm:grid-cols-2">
              <router-link to="/directory"><AppButton variant="secondary" size="lg">Find an Office</AppButton></router-link>
              <router-link to="/register"><AppButton variant="secondary" size="lg">Register as Visitor</AppButton></router-link>
              <router-link to="/status"><AppButton variant="primary" size="lg">Check Visitor Status</AppButton></router-link>
              <router-link to="/office"><AppButton variant="primary" size="lg">AR Navigation</AppButton></router-link>
            </div>
          </div>
          <div class="rounded-3xl bg-white p-6 text-[var(--bsu-ink)] shadow-2xl sm:p-8">
            <p class="eyebrow text-[var(--bsu-red)]">Public Active / Occupancy</p>
            <p class="mt-4 text-6xl font-bold text-[var(--bsu-red)]">{{ occupancy }}</p>
            <p class="mt-1 text-sm text-[var(--bsu-ink-2)]">visitors currently on campus</p>
            <div class="mt-6 border-t border-[var(--bsu-line)] pt-5">
              <p class="text-sm font-semibold">Plan your visit before you arrive</p>
              <p class="mt-2 text-sm leading-6 text-[var(--bsu-ink-2)]">Queue counts and estimated waits are anonymous. Personal details are collected only when you register.</p>
            </div>
          </div>
        </div>
      </section>
      <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="mb-7 flex items-end justify-between gap-4"><div><p class="eyebrow">Live directory</p><h2 class="mt-2 text-3xl font-bold">Where do you need to go?</h2></div><router-link to="/directory" class="font-semibold text-[var(--bsu-red)]">View all</router-link></div>
        <div v-if="loading" class="text-sm text-[var(--bsu-ink-2)]">Loading office availability...</div>
        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="office in offices.slice(0, 6)" :key="office.id" class="surface p-6">
            <div class="flex items-start justify-between gap-3"><h3 class="text-lg font-bold">{{ office.office_name }}</h3><span class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{{ office.status }}</span></div>
            <p class="mt-5 text-sm text-[var(--bsu-ink-2)]">{{ office.queue_count }} in queue · about {{ office.estimated_wait_minutes }} min wait</p>
            <router-link :to="`/register?office=${office.id}`" class="mt-5 inline-block font-semibold text-[var(--bsu-red)]">Register here →</router-link>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import AppButton from "@/components/AppButton.vue";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const offices = ref([]);
const occupancy = ref(0);
const loading = ref(true);
onMounted(async () => {
  try { const response = await fetch(`${API_BASE}/public/directory`); const data = await response.json(); offices.value = data.offices || []; occupancy.value = data.occupancy?.active_visitors || 0; } finally { loading.value = false; }
});
</script>
