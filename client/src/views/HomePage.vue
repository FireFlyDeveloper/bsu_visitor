<template>
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <Navbar />

    <!-- Hero -->
    <section
      class="relative isolate overflow-hidden border-b border-[var(--line)]"
    >
      <div
        class="absolute inset-0 -z-10"
        :style="{
          backgroundImage:
            'url(https://picsum.photos/seed/bsu-campus-hero/2000/900)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }"
      />
      <div
        class="absolute inset-0 -z-10 bg-gradient-to-tr from-[var(--paper)] via-[var(--paper)]/85 to-transparent"
      />
      <div
        class="absolute inset-0 -z-10 opacity-30"
        :style="{
          backgroundImage:
            'url(\'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>\')',
        }"
      />

      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div class="rise">
            <p class="eyebrow">Live campus view</p>
            <h1
              class="mt-3 max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Every visitor,<br />
              <span class="text-[var(--brand)]">accounted for.</span>
            </h1>
            <p class="lede mt-5 max-w-xl">
              A live overview of offices, users, and visitor activity across
              the BSU campus. Open the kiosk to register a new visitor.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <router-link to="/admin/dashboard">
                <AppButton variant="primary" size="lg">
                  Open dashboard
                </AppButton>
              </router-link>
              <router-link to="/security/kiosk">
                <AppButton variant="secondary" size="lg">
                  Guard kiosk
                </AppButton>
              </router-link>
            </div>
          </div>

          <!-- Live counter -->
          <div
            class="surface-raised rise rise-delay-1 p-6 lg:p-8"
            aria-live="polite"
          >
            <div class="flex items-center justify-between">
              <p class="eyebrow">Today</p>
              <span class="flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                Live
              </span>
            </div>
            <p class="font-display mt-3 text-6xl font-bold tabular tracking-tight lg:text-7xl">
              {{ todayCount }}
            </p>
            <p class="mt-1 text-sm text-[var(--ink-3)]">
              visitors logged in
            </p>
            <div class="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-5">
              <div>
                <p class="text-xs text-[var(--ink-3)]">Offices</p>
                <p class="font-display text-xl font-semibold tabular">
                  {{ officeStore.offices.length }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[var(--ink-3)]">Users</p>
                <p class="font-display text-xl font-semibold tabular">
                  {{ userStore.users.length }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[var(--ink-3)]">Active</p>
                <p class="font-display text-xl font-semibold tabular">
                  {{ activeCount }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Office cards -->
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <p class="eyebrow">Offices</p>
          <h2 class="mt-2 text-2xl font-bold">Available right now</h2>
        </div>
        <router-link
          to="/admin/offices"
          class="text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          Manage →
        </router-link>
      </div>

      <div v-if="officeStore.fetchingOffices" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="i in 3" :key="i" height="160" />
      </div>

      <div v-else-if="!officeStore.offices.length">
        <EmptyState
          icon="users"
          title="No offices yet"
          description="Add offices in the admin panel to start managing visitors."
        />
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(office, i) in officeStore.offices"
          :key="office.id"
          :class="stagger(i)"
          class="surface group cursor-pointer p-6 transition-transform hover:-translate-y-0.5"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-display text-2xl font-bold tracking-tight">
                {{ office.office_name }}
              </p>
              <p class="mt-1 text-xs text-[var(--ink-3)]">
                {{ office.type || "Standard" }}
              </p>
            </div>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="statusTone(office.status)"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="statusDot(office.status)"></span>
              {{ statusLabel(office.status) }}
            </span>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4">
            <div>
              <p class="text-xs text-[var(--ink-3)]">In queue</p>
              <p class="font-display text-2xl font-semibold tabular">
                {{ officeCounts[office.id] ?? 0 }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--ink-3)]">Today</p>
              <p class="font-display text-2xl font-semibold tabular text-[var(--ink-3)]">
                —
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3-up info grid (asymmetric on lg) -->
    <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div class="grid gap-4 lg:grid-cols-12">
        <article
          class="surface lg:col-span-5 p-8"
        >
          <p class="eyebrow">Visitor directory</p>
          <h3 class="mt-2 text-xl font-bold">
            One profile per guest, reused across visits.
          </h3>
          <p class="mt-3 text-sm text-[var(--ink-2)]">
            Store name, contact, address, and photo. Returning visitors are
            matched by contact number on their next check-in.
          </p>
        </article>
        <article class="surface lg:col-span-4 p-8">
          <p class="eyebrow">Visit log</p>
          <h3 class="mt-2 text-xl font-bold">Every entry, timestamped.</h3>
          <p class="mt-3 text-sm text-[var(--ink-2)]">
            Filter by visitor name, day, or month. Export to CSV or PDF.
          </p>
        </article>
        <article class="surface lg:col-span-3 p-8">
          <p class="eyebrow">Role-based</p>
          <h3 class="mt-2 text-xl font-bold">Three roles.</h3>
          <ul class="mt-3 space-y-1.5 text-sm text-[var(--ink-2)]">
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Admin
            </li>
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-sky-500"></span> Security
            </li>
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Staff
            </li>
          </ul>
        </article>
      </div>
    </section>

    <footer class="border-t border-[var(--line)] py-8">
      <div
        class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-[var(--ink-3)] sm:flex-row sm:px-6 lg:px-8"
      >
        <span>© {{ new Date().getFullYear() }} Batangas State University</span>
        <span class="font-mono tabular text-[0.6875rem]">v2.0 · editorial</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useOfficeStore } from "@/store/office";
import { useVisitorLogStore } from "@/store/visitorLog";
import { useUserStore } from "@/store/user";
import Navbar from "@/components/Navbar.vue";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { stagger } from "@/composables/useStagger";

const officeStore = useOfficeStore();
const visitorLogStore = useVisitorLogStore();
const userStore = useUserStore();

const officeCounts = ref({});
const todayCount = ref(0);
const activeCount = ref(0);

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

onMounted(async () => {
  await officeStore.fetchOffices();
  try {
    const res = await visitorLogStore.fetchCountPerOffice();
    const pending = (res.data || []).filter((d) => d.status === "pending");
    officeCounts.value = Object.fromEntries(
      pending.map((d) => [d.office_id, d.total_visits]),
    );
  } catch (_) {}
  try {
    const todayKey = new Date().toDateString();
    const data = await visitorLogStore.fetchVisitLogs({ perPage: 200 });
    const all = data.logs || [];
    todayCount.value = all.filter(
      (v) => v.time_in && new Date(v.time_in).toDateString() === todayKey,
    ).length;
    activeCount.value = all.filter((v) => !v.time_out).length;
  } catch (_) {}
  try {
    await userStore.fetchAllUsers();
  } catch (_) {}
});
</script>
