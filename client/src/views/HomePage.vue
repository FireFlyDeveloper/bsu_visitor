<template>
  <div class="min-h-screen bg-white text-[var(--bsu-ink)]">
    <Navbar />

    <!-- HERO — uses the actual BSU campus photo (bsu_outside.png) -->
    <section
      class="relative isolate overflow-hidden border-b-4 border-[var(--bsu-red)]"
    >
      <div class="absolute inset-0 -z-10">
        <img
          src="/img/bsu_outside.png"
          alt="BSU campus"
          class="h-full w-full object-cover object-center"
        />
      </div>
      <!-- Red wash overlay matching the brand -->
      <div
        class="absolute inset-0 -z-10 bg-gradient-to-tr from-[var(--bsu-red)]/95 via-[var(--bsu-red)]/80 to-[var(--bsu-red)]/30"
      />

      <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div class="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div class="rise">
            <p class="eyebrow text-white/90">Live campus view</p>
            <h1
              class="mt-3 max-w-2xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Welcome to<br />
              <span class="text-white">BSU Visitor.</span>
            </h1>
            <p class="mt-5 max-w-xl text-lg leading-relaxed text-white/90">
              A role-based campus access management system for Batangas State
              University. Sign in to log visitors, manage queues, and monitor
              campus activity.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <router-link to="/admin/dashboard">
                <AppButton variant="primary" size="lg">
                  Open dashboard
                </AppButton>
              </router-link>
              <router-link
                v-if="userStore.isLoggedIn"
                to="/office"
              >
                <AppButton variant="secondary" size="lg">
                  AR navigation
                </AppButton>
              </router-link>
            </div>
          </div>

          <!-- Live counter card — red theme -->
          <div
            class="rise rise-delay-1 rounded-3xl border-2 border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur lg:p-8"
            aria-live="polite"
          >
            <div class="flex items-center justify-between">
              <p class="eyebrow">Today</p>
              <span class="flex items-center gap-1.5 text-xs text-[var(--bsu-red)]">
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--bsu-red)]"></span>
                Live
              </span>
            </div>
            <p
              class="font-display mt-3 text-6xl font-bold tabular tracking-tight text-[var(--bsu-red)] lg:text-7xl"
            >
              {{ todayCount }}
            </p>
            <p class="mt-1 text-sm text-[var(--bsu-ink-2)]">visitors logged in</p>
            <div
              class="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--bsu-line)] pt-5"
            >
              <div>
                <p class="text-xs text-[var(--bsu-ink-3)]">Offices</p>
                <p
                  class="font-display text-xl font-bold tabular text-[var(--bsu-ink)]"
                >
                  {{ officeStore.offices.length }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[var(--bsu-ink-3)]">Users</p>
                <p
                  class="font-display text-xl font-bold tabular text-[var(--bsu-ink)]"
                >
                  {{ userStore.users.length }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[var(--bsu-ink-3)]">Active</p>
                <p
                  class="font-display text-xl font-bold tabular text-[var(--bsu-red)]"
                >
                  {{ activeCount }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Office status strip — uses the original red card design from the project -->
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <p class="eyebrow">Offices</p>
          <h2 class="mt-2 text-2xl font-bold text-[var(--bsu-ink)]">
            Available right now
          </h2>
        </div>
        <router-link
          to="/admin/offices"
          class="text-sm font-semibold text-[var(--bsu-red)] hover:underline"
        >
          Manage →
        </router-link>
      </div>

      <div
        v-if="officeStore.fetchingOffices"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Skeleton v-for="i in 3" :key="i" height="180" />
      </div>

      <div v-else-if="!officeStore.offices.length">
        <EmptyState
          icon="users"
          title="No offices yet"
          description="Add offices in the admin panel to start managing visitors."
        />
      </div>

      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <!-- The original BSU red office card — the project's signature look -->
        <article
          v-for="(office, i) in officeStore.offices"
          :key="office.id"
          :class="stagger(i)"
          class="overflow-hidden rounded-2xl bg-[var(--bsu-red)] shadow-lg transition-transform hover:-translate-y-1"
        >
          <!-- White header strip with office name -->
          <div
            class="bg-white px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-[var(--bsu-ink)]"
          >
            {{ office.office_name }}
          </div>
          <!-- Red body -->
          <div class="px-5 py-5 text-white">
            <div class="text-center">
              <p class="text-xs font-medium uppercase tracking-wider text-white/80">
                No. of queue
              </p>
              <p class="font-display mt-1 text-4xl font-bold tabular">
                {{ officeCounts[office.id] ?? 0 }}
              </p>
            </div>
            <div class="mt-4 border-t border-white/20 pt-4 text-center">
              <p class="text-xs font-medium uppercase tracking-wider text-white/80">
                Status
              </p>
              <p class="font-display mt-1 text-xl font-bold uppercase tracking-wider">
                {{ office.status }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Security panel shortcut — only for security role -->
    <section
      v-if="userStore.currentUser?.role === 'security'"
      class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
    >
      <div
        class="overflow-hidden rounded-3xl border-2 border-[var(--bsu-red)] bg-gradient-to-br from-white via-white to-[var(--bsu-red)]/5 shadow-lg"
      >
        <div class="grid items-center gap-6 p-8 lg:grid-cols-[1fr_auto] lg:p-10">
          <div>
            <p class="eyebrow text-[var(--bsu-red)]">Security panel</p>
            <h2
              class="font-display mt-2 text-2xl font-bold text-[var(--bsu-ink)] lg:text-3xl"
            >
              Visitor status
            </h2>
            <p class="mt-3 max-w-2xl text-sm text-[var(--bsu-ink-2)]">
              See who is currently on campus, mark visitors as left, and respond
              to overdue alarms. All from one panel.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div
              class="rounded-2xl border-2 border-[var(--bsu-red)]/20 bg-white px-5 py-4 text-center shadow-sm"
            >
              <p class="text-xs font-medium uppercase tracking-wider text-[var(--bsu-ink-3)]">
                Active visitors
              </p>
              <p
                class="font-display mt-1 text-3xl font-bold tabular text-[var(--bsu-red)]"
              >
                {{ activeCount }}
              </p>
            </div>
            <router-link to="/security/visitors/status">
              <AppButton variant="primary" size="lg">
                Open visitor status →
              </AppButton>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 3-up info grid (asymmetric on lg) -->
    <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div class="grid gap-4 lg:grid-cols-12">
        <article class="surface lg:col-span-5 p-8">
          <p class="eyebrow">Visitor directory</p>
          <h3 class="mt-2 text-xl font-bold text-[var(--bsu-ink)]">
            One profile per guest, reused across visits.
          </h3>
          <p class="mt-3 text-sm text-[var(--bsu-ink-2)]">
            Store name, contact, address, and photo. Returning visitors are
            matched by contact number on their next check-in.
          </p>
        </article>
        <article class="surface lg:col-span-4 p-8">
          <p class="eyebrow">Visit log</p>
          <h3 class="mt-2 text-xl font-bold text-[var(--bsu-ink)]">
            Every entry, timestamped.
          </h3>
          <p class="mt-3 text-sm text-[var(--bsu-ink-2)]">
            Filter by visitor name, day, or month. Export to CSV or PDF.
          </p>
        </article>
        <article class="surface lg:col-span-3 p-8">
          <p class="eyebrow">Role-based</p>
          <h3 class="mt-2 text-xl font-bold text-[var(--bsu-ink)]">Three roles.</h3>
          <ul class="mt-3 space-y-1.5 text-sm text-[var(--bsu-ink-2)]">
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[var(--bsu-red)]"></span>
              Admin
            </li>
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[var(--bsu-charcoal)]"></span>
              Security
            </li>
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[var(--bsu-green)]"></span>
              Staff
            </li>
          </ul>
        </article>
      </div>
    </section>

    <footer class="bg-[var(--bsu-red)] text-white">
      <div
        class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs sm:flex-row sm:px-6 lg:px-8"
      >
        <div class="flex items-center gap-3">
          <img
            src="/logo/BatStateU-NEU-Logo-1-300x282.png"
            alt="BSU"
            class="h-8 w-8"
          />
          <span>© {{ new Date().getFullYear() }} Batangas State University</span>
        </div>
        <div class="flex items-center gap-3">
          <img
            src="/logo/BAGONG_PILIPINAS_LOGO-e1693281031955.png"
            alt="Bagong Pilipinas"
            class="h-8 w-8"
          />
          <span class="font-mono tabular text-[0.6875rem]">NEU · Campus</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
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
