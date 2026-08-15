<template>
  <div class="min-h-[100dvh] bg-[#8f0f20] text-white">
    <div
      class="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_32%),linear-gradient(145deg,var(--bsu-red)_0%,#9f1024_48%,#5d0714_100%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-7">
      <header class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_14px_36px_rgba(61,7,19,0.28)]">
            <img
              src="/logo/BatStateU-NEU-Logo-1-300x282.png"
              alt="BSU"
              class="h-9 w-9"
            />
          </div>
          <div class="min-w-0">
            <p class="font-display text-base font-bold leading-tight tracking-tight text-white">
              BSU Visitor
            </p>
            <p class="truncate text-xs font-medium text-white/72">
              Batangas State University
            </p>
          </div>
        </div>
        <router-link
          to="/"
          class="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/16 bg-white/12 px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(61,7,19,0.18)] backdrop-blur transition hover:bg-white/18 active:translate-y-px"
        >
          Home
        </router-link>
      </header>

      <main class="flex flex-1 flex-col">
        <!-- Picker -->
        <section v-if="!selected" class="pt-8 flex-1 sm:pt-10">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/82 backdrop-blur">
            Self-service visitor registration
          </div>
          <h1 class="mt-4 max-w-xl text-3xl font-bold tracking-tight !text-white sm:text-4xl">
            Register your visit at any office.
          </h1>
          <p class="mt-3 max-w-lg text-sm leading-6 text-white/78">
            Pick the office you're here to see. You'll enter your details on the
            next step — no login, no photo needed.
          </p>

          <div class="mb-3 mt-7 flex items-end justify-between gap-3">
            <h2 id="office-list-title" class="text-lg font-bold !text-white">
              Offices
            </h2>
            <p class="mt-1 text-xs text-white/62">
              {{ loading ? "Loading offices" : `${offices.length} available` }}
            </p>
          </div>

          <div v-if="loading" class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="i in 4"
              :key="i"
              class="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur"
            >
              <div class="h-4 w-2/3 animate-pulse rounded-full bg-white/22" />
              <div class="mt-3 h-3 w-1/3 animate-pulse rounded-full bg-white/14" />
            </div>
          </div>

          <div
            v-else-if="!offices.length"
            class="rounded-3xl border border-white/16 bg-white/12 p-6 backdrop-blur"
          >
            <h2 class="text-xl font-bold !text-white">No offices available</h2>
            <p class="mt-2 text-sm leading-6 text-white/72">
              Registration is closed right now. Please ask the guard for help.
            </p>
          </div>

          <ul v-else class="grid gap-3 sm:grid-cols-2">
            <li v-for="o in offices" :key="o.id">
              <button
                type="button"
                @click="select(o)"
                class="group flex min-h-[6.5rem] w-full flex-col justify-between rounded-3xl border border-white/14 bg-white/[0.94] p-4 text-left text-[var(--bsu-ink)] shadow-[0_18px_44px_rgba(61,7,19,0.22)] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-px"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="line-clamp-2 text-base font-bold leading-snug tracking-tight text-[var(--bsu-ink)]">
                      {{ o.office_name }}
                    </p>
                    <p class="mt-1 text-xs font-semibold text-[var(--bsu-ink-2)]">
                      {{ o.status === "available" ? "Open for visitors" : "Status: " + (o.status || "unknown") }}
                    </p>
                  </div>
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bsu-red-soft)] text-[var(--bsu-red)] transition group-hover:bg-[var(--bsu-red)] group-hover:text-white"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
                <p class="mt-4 text-xs font-bold text-[var(--bsu-red)]">
                  {{
                    typeof o.queue_count === "number" && o.queue_count > 0
                      ? `${o.queue_count} waiting`
                      : "Register now"
                  }}
                </p>
              </button>
            </li>
          </ul>
        </section>

        <!-- Registration form / success -->
        <section v-else class="pt-8 sm:pt-10">
          <button
            type="button"
            @click="selected = null"
            class="mb-4 inline-flex items-center gap-2 rounded-2xl border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/18"
          >
            ← Back to office list
          </button>
          <PublicRegistration
            :office="selected"
            :loading="false"
            show-back
            @back="selected = null"
          />
        </section>
      </main>

      <footer class="mt-8 rounded-3xl border border-white/12 bg-white/10 p-4 text-xs leading-5 text-white/68 backdrop-blur">
        Your information is used only for campus visit records.
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import PublicRegistration from "@/components/PublicRegistration.vue";

const API_BASE = import.meta.env.VITE_API_BASE;

const route = useRoute();
const offices = ref([]);
const loading = ref(true);
const selected = ref(null);

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

function select(o) {
  selected.value = o;
}

onMounted(async () => {
  await load();
  // ?office=ID jumps straight to the form (e.g. from the directory page).
  const officeId = Number(route.query.office);
  if (officeId) {
    const match = offices.value.find((o) => o.id === officeId);
    if (match) selected.value = match;
  }
});
</script>
