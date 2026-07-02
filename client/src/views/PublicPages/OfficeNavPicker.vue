<template>
  <div
    class="min-h-screen bg-gradient-to-br from-[var(--bsu-red)] via-[var(--bsu-red)] to-[#7a0e1e] text-white"
  >
    <div class="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img
            src="/logo/BatStateU-NEU-Logo-1-300x282.png"
            alt="BSU"
            class="h-10 w-10"
          />
          <div>
            <p class="font-display text-sm font-bold tracking-tight">
              BSU Visitor
            </p>
            <p class="text-[0.65rem] text-white/80">
              Batangas State University
            </p>
          </div>
        </div>
        <router-link
          to="/"
          class="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur hover:bg-white/20"
        >
          Home
        </router-link>
      </header>

      <section class="mt-10">
        <p class="eyebrow text-white/80">AR navigation</p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Where are you heading?
        </h1>
        <p class="mt-2 max-w-md text-sm text-white/80">
          Pick the office you want to reach. We will open the camera and draw a
          3D arrow in the direction of your destination.
        </p>
      </section>

      <section class="mt-8 flex-1">
        <div
          v-if="loading"
          class="grid gap-3 sm:grid-cols-2"
        >
          <div
            v-for="i in 4"
            :key="i"
            class="h-20 animate-pulse rounded-2xl bg-white/10"
          />
        </div>

        <div
          v-else-if="!offices.length"
          class="rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-sm text-white/80"
        >
          No offices are registered yet. Ask an admin to add one.
        </div>

        <ul
          v-else
          class="grid gap-3 sm:grid-cols-2"
        >
          <li
            v-for="(office, i) in offices"
            :key="office.id"
            :class="stagger(i)"
            class="rise"
          >
            <button
              type="button"
              @click="go(office)"
              class="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-left shadow-lg backdrop-blur transition hover:border-white/40 hover:bg-white/20"
            >
              <div>
                <p class="text-base font-bold uppercase tracking-wider">
                  {{ office.office_name }}
                </p>
                <p class="mt-1 text-xs text-white/70">
                  {{ office.status || "Open" }}
                </p>
              </div>
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--bsu-red)] shadow transition group-hover:scale-105"
                aria-hidden="true"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </button>
          </li>
        </ul>
      </section>

      <footer class="mt-8 text-center text-[0.65rem] text-white/60">
        Logged in as <strong class="font-semibold text-white">{{ userName }}</strong>
        · AR uses your device camera
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useOfficeStore } from "@/store/office";
import { useUserStore } from "@/store/user";
import { stagger } from "@/composables/useStagger";

const router = useRouter();
const officeStore = useOfficeStore();
const userStore = useUserStore();

const loading = ref(true);
const offices = computed(() => officeStore.offices);
const userName = computed(
  () => userStore.currentUser?.full_name || userStore.currentUser?.username || "staff",
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
