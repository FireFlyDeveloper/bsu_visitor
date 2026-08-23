<template>
  <div class="min-h-[100dvh] bg-[#fbfaf7] text-[var(--bsu-ink)]">
    <div class="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 py-8 sm:px-6">
      <main class="flex flex-1 flex-col">
        <section class="sm:pt-2">
          <div class="inline-flex items-center gap-2 rounded-full border border-[var(--bsu-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--bsu-red)]">
            <Navigation class="h-3.5 w-3.5" aria-hidden="true" />
            Camera-guided visitor directions
          </div>
          <h1 class="mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
            Choose your destination before opening AR.
          </h1>
          <p class="mt-3 max-w-lg text-sm leading-6 text-[var(--bsu-ink-2)] sm:text-base">
            Select an office first. Your phone will ask for camera access, localize in the mapped area, then show the route marker.
          </p>
        </section>

        <section class="mt-7 flex-1 sm:mt-9" aria-labelledby="office-list-title">
          <div class="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="office-list-title" class="text-lg font-bold">
                Offices
              </h2>
              <p class="mt-1 text-xs text-[var(--bsu-ink-2)]">
                {{ loading ? "Loading destinations" : `${navigationOffices.length} available destination${navigationOffices.length === 1 ? "" : "s"}` }}
              </p>
            </div>
            <span class="hidden rounded-full bg-[var(--bsu-red-soft)] px-3 py-1 text-xs font-bold text-[var(--bsu-red)] sm:inline-flex">
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
              class="rounded-3xl border border-[var(--bsu-line)] bg-white p-4"
            >
              <div class="h-4 w-2/3 animate-pulse rounded-full bg-[var(--bsu-paper-2)]" />
              <div class="mt-3 h-3 w-1/3 animate-pulse rounded-full bg-[var(--bsu-paper-2)]" />
              <div class="mt-5 h-11 w-full animate-pulse rounded-2xl bg-[var(--bsu-paper-2)]" />
            </div>
          </div>

          <div
            v-else-if="!navigationOffices.length"
            class="rounded-3xl border-2 border-dashed border-[var(--bsu-line)] bg-white p-6 text-left"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bsu-red-soft)] text-[var(--bsu-red)]">
              <Building2 class="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 class="mt-4 text-xl font-bold">No offices yet</h2>
            <p class="mt-2 text-sm leading-6 text-[var(--bsu-ink-2)]">
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
                class="group flex min-h-[7rem] w-full flex-col justify-between rounded-3xl border border-[var(--bsu-line)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-px"
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  Building2,
  ChevronRight,
  MapPinned,
  Navigation,
} from "@lucide/vue";
import { useOfficeStore } from "@/store/office";
import { stagger } from "@/composables/useStagger";
import { AR_DESTINATIONS } from "@/config/arNavigation";

const router = useRouter();
const officeStore = useOfficeStore();

const loading = ref(true);
const offices = computed(() => officeStore.offices);
const navigationOffices = computed(() =>
  AR_DESTINATIONS
    .filter((destination) => destination.id !== "guard-house")
    .map((destination) => {
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
    // Public AR picker must work logged-out — use the public directory
    // endpoint, not the authed /offices list.
    const res = await fetch(`${API_BASE}/public/directory`);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      officeStore.offices = Array.isArray(data.offices) ? data.offices : [];
    }
  } catch (_) {
    /* leave store as-is; AR routes still render with fallback status */
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
