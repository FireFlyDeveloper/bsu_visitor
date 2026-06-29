<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <Navbar />

    <main>
      <section
        class="relative grid gap-8 shadow-[0_18px_50px_rgba(109,112,147,0.08)] bg-[url('/img/bsu_outside.png')] bg-cover bg-center min-h-[500px]"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-slate-500/50"></div>

        <!-- Content -->
        <div
          class="relative z-10 flex flex-col items-center justify-center text-center space-y-8 p-10"
        >
          <p
            class="text-xl font-semibold uppercase tracking-[0.24em] text-red-700"
          >
            Welcome to BSU Visitor
          </p>

          <!-- Office Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div
              v-for="office in officeStore.offices"
              :key="office.id"
              class="rounded-2xl bg-red-700 shadow-lg overflow-hidden w-64"
            >
              <!-- Office Name -->
              <div
                class="bg-white text-center py-2 font-bold text-lg uppercase"
              >
                {{ office.office_name }}
              </div>

              <!-- Content -->
              <div class="p-6 text-white text-center space-y-3">
                <p class="text-sm opacity-90">No. of Queue</p>

                <!-- ✅ DYNAMIC COUNT -->
                <p class="text-4xl font-bold">
                  {{ officeCounts[office.id] ?? 0 }}
                </p>

                <div>
                  <p class="text-sm opacity-90">Status</p>
                  <p class="font-semibold text-3xl uppercase">
                    {{ office.status }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p class="max-w-xl text-lg leading-8 text-white">
            Quickly register new visitors, review past visit records, and keep
            your campus reception running smoothly.
          </p>
        </div>
      </section>

      <!-- INFO CARDS -->
      <section
        class="mt-10 grid gap-6 md:grid-cols-3 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <article
          class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 class="text-xl font-semibold text-slate-950">
            Visitor Directory
          </h2>
          <p class="mt-3 text-slate-600">
            Store visitor profiles with contact data, ID type, and address
            details.
          </p>
        </article>

        <article
          class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 class="text-xl font-semibold text-slate-950">Visit Logs</h2>
          <p class="mt-3 text-slate-600">
            See real-time check-in history for every office and monitor active
            visits.
          </p>
        </article>

        <article
          class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 class="text-xl font-semibold text-slate-950">Secure Access</h2>
          <p class="mt-3 text-slate-600">
            Only authenticated staff can create, update, or delete visitor
            records.
          </p>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useOfficeStore } from "../store/office";
import { useVisitorLogStore } from "../store/visitorLog";
import Navbar from "../components/Navbar.vue";

const officeStore = useOfficeStore();
const visitorLogStore = useVisitorLogStore();

const officeCounts = ref({});

onMounted(async () => {
  await officeStore.fetchOffices();

  const res = await visitorLogStore.fetchCountPerOffice();

  // ✅ only count pending
  const pendingOnly = res.data.filter((item) => item.status === "pending");

  officeCounts.value = Object.fromEntries(
    pendingOnly.map((item) => [item.office_id, item.total_visits]),
  );
});
</script>
