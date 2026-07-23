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
          <Home class="h-4 w-4" aria-hidden="true" />
          Home
        </router-link>
      </header>

      <main class="flex flex-1 flex-col">
        <section class="pt-10 sm:pt-14">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/82 backdrop-blur">
            <Navigation class="h-3.5 w-3.5" aria-hidden="true" />
            Camera-guided visitor directions
          </div>
          <h1 class="mt-4 max-w-xl text-3xl font-bold tracking-tight !text-white sm:text-5xl">
            Choose your destination before opening AR.
          </h1>
          <p class="mt-3 max-w-lg text-sm leading-6 text-white/78 sm:text-base">
            Select an office first. Your phone will ask for camera access, localize in the mapped area, then show the route marker.
          </p>
        </section>

        <section class="mt-7 flex-1 sm:mt-9" aria-labelledby="office-list-title">
          <div class="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="office-list-title" class="text-lg font-bold !text-white">
                Offices
              </h2>
              <p class="mt-1 text-xs text-white/62">
                {{ loading ? "Loading destinations" : `${navigationOffices.length} available destination${navigationOffices.length === 1 ? "" : "s"}` }}
              </p>
            </div>
            <span class="hidden rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--bsu-red)] shadow-sm sm:inline-flex">
              WebXR ready
            </span>
          </div>

          <div
            v-if="loading"
            class="grid gap-3 sm:grid-cols-2"
            aria-label="Loading offices"
          >
            <div
              v-for="i in 4"
              :key="i"
              class="rounded-3xl border border-white/12 bg-white/10 p-4 shadow-[0_16px_40px_rgba(61,7,19,0.18)] backdrop-blur"
            >
              <div class="h-4 w-2/3 animate-pulse rounded-full bg-white/22" />
              <div class="mt-3 h-3 w-1/3 animate-pulse rounded-full bg-white/14" />
              <div class="mt-5 h-11 w-full animate-pulse rounded-2xl bg-white/12" />
            </div>
          </div>

          <div
            v-else-if="!navigationOffices.length"
            class="rounded-3xl border border-white/16 bg-white/12 p-6 text-left shadow-[0_16px_40px_rgba(61,7,19,0.2)] backdrop-blur"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--bsu-red)]">
              <Building2 class="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 class="mt-4 text-xl font-bold !text-white">No offices yet</h2>
            <p class="mt-2 text-sm leading-6 text-white/72">
              There are no visitor destinations to show. Ask an admin to add offices before using AR navigation.
            </p>
          </div>

          <ul
            v-else
            class="grid gap-3 sm:grid-cols-2"
          >
            <li
              v-for="(office, i) in navigationOffices"
              :key="office.id"
              :class="stagger(i)"
              class="rise"
            >
              <button
                type="button"
                @click="go(office)"
                class="group flex min-h-[7rem] w-full flex-col justify-between rounded-3xl border border-white/14 bg-white/[0.94] p-4 text-left text-[var(--bsu-ink)] shadow-[0_18px_44px_rgba(61,7,19,0.22)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_22px_54px_rgba(61,7,19,0.3)] active:translate-y-px"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="line-clamp-2 text-base font-bold leading-snug tracking-tight text-[var(--bsu-ink)]">
                      {{ office.office_name }}
                    </p>
                    <p class="mt-1 text-xs font-semibold text-[var(--bsu-ink-2)]">
                      {{ office.status || "Open for visitors" }}
                    </p>
                  </div>
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bsu-red-soft)] text-[var(--bsu-red)] transition group-hover:bg-[var(--bsu-red)] group-hover:text-white"
                    aria-hidden="true"
                  >
                    <ChevronRight class="h-5 w-5" />
                  </span>
                </div>
                <div class="mt-5 flex items-center gap-2 text-xs font-bold text-[var(--bsu-red)]">
                  <MapPinned class="h-4 w-4" aria-hidden="true" />
                  Start route setup
                </div>
              </button>
            </li>
          </ul>
        </section>
      </main>

      <footer class="mt-8 rounded-3xl border border-white/12 bg-white/10 p-4 text-xs leading-5 text-white/68 backdrop-blur">
        <div class="flex items-start gap-3">
          <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
          <p>
            Camera access starts only after you pick a destination. Map
            <strong class="font-mono text-white">{{ MULTISET_MAP_ID }}</strong>
            is used for campus localization.
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  Building2,
  ChevronRight,
  Home,
  MapPinned,
  Navigation,
  ShieldCheck,
} from "@lucide/vue";
import { useOfficeStore } from "@/store/office";
import { stagger } from "@/composables/useStagger";
import { AR_DESTINATIONS, MULTISET_MAP_ID } from "@/config/arNavigation";

const router = useRouter();
const officeStore = useOfficeStore();

const loading = ref(true);
const offices = computed(() => officeStore.offices);
const navigationOffices = computed(() =>
  AR_DESTINATIONS.map((destination) => {
    const storedOffice = offices.value.find((office) => {
      const officeName = String(office.office_name || "").trim().toLowerCase();
      return destination.aliases?.some(
        (alias) => officeName === String(alias).trim().toLowerCase(),
      );
    });

    return {
      ...(storedOffice || {}),
      id: destination.id,
      office_name: destination.name,
      status: storedOffice?.status || "AR route ready",
    };
  }),
);

async function load() {
  loading.value = true;
  try {
    await officeStore.fetchOffices();
  } finally {
    loading.value = false;
  }
}

function go(office) {
  router.push({
    path: "/navigate",
    query: { to: office.id, name: office.office_name },
  });
}

onMounted(load);
</script>
