<template>
  <div class="min-h-[100dvh] bg-[#fbfaf7] text-[var(--bsu-ink)]">
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header>
        <div
          class="inline-flex items-center gap-2 rounded-full border border-[var(--bsu-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--bsu-red)]"
        >
          <ClipboardList class="h-3.5 w-3.5" aria-hidden="true" />
          Self-service visitor registration
        </div>
        <h1 class="font-display mt-4 text-3xl font-bold tracking-tight">
          Register your visit
        </h1>
        <p class="mt-1 max-w-xl text-sm text-[var(--bsu-ink-2)]">
          Pick the office you're here to see. You'll enter your details on the
 next step — no login needed. A visitor photo will be taken with
 your camera.
        </p>
      </header>

      <main class="mt-8">
        <!-- Security check-in instructions -->
        <aside class="mb-6 flex items-start gap-3 rounded-2xl border border-[var(--bsu-line)] bg-white p-4">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bsu-red-soft)] text-[var(--bsu-red)]">
            <ShieldCheck class="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-sm font-bold">Can&rsquo;t register on your phone?</p>
            <p class="mt-1 text-sm leading-6 text-[var(--bsu-ink-2)]">
              No problem — head to the <span class="font-semibold">Security / Guard House</span> at the campus entrance. A visitor registration kiosk is available there, and our security staff will register your visit for you.
            </p>
          </div>
        </aside>

        <!-- Picker -->
        <section v-if="!selected">
          <div class="mb-3 flex items-end justify-between gap-3">
            <h2 id="office-list-title" class="font-display text-lg font-bold">
              Offices
            </h2>
            <p class="mt-1 text-xs text-[var(--bsu-ink-2)]">
              {{ loading ? "Loading offices" : `${offices.length} available` }}
            </p>
          </div>

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
              Registration is closed right now. Please ask the guard for help.
            </p>
          </div>

          <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="o in offices" :key="o.id">
              <button
                type="button"
                @click="select(o)"
                class="group flex min-h-[11rem] w-full flex-col rounded-3xl border border-[var(--bsu-line)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div class="flex items-start justify-between gap-3">
                  <h3 class="font-display line-clamp-2 text-lg font-bold uppercase tracking-wide">
                    {{ o.office_name }}
                  </h3>
                </div>
                <p
                  class="mt-1 text-xs font-semibold uppercase tracking-wider"
                  :class="o.status === 'available' ? 'text-emerald-600' : 'text-slate-500'"
                >
                  {{ o.status === "available" ? "Open for visitors" : o.status || "Unknown" }}
                </p>

                <p class="mt-4 text-sm text-[var(--bsu-ink-2)]">
                  <span class="font-display text-2xl font-bold text-[var(--bsu-red)]">{{ o.queue_count ?? 0 }}</span>
                  &nbsp;currently waiting
                </p>

                <span
                  class="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[var(--bsu-red)] px-3 py-2.5 text-center text-sm font-bold text-white transition group-hover:bg-[#a30e22]"
                >
                  Register here →
                </span>
              </button>
            </li>
          </ul>
        </section>

        <!-- Registration form / success -->
        <section v-else class="pt-2">
          <button
            type="button"
            @click="selected = null"
            class="mb-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--bsu-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--bsu-ink)] transition hover:bg-[var(--bsu-paper-2)]"
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

      <footer class="mt-10 rounded-3xl border border-[var(--bsu-line)] bg-white p-4 text-xs leading-5 text-[var(--bsu-ink-2)]">
        Your information is used only for campus visit records.
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ClipboardList, ShieldCheck } from "@lucide/vue";
import PublicRegistration from "@/components/PublicRegistration.vue";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

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

<style scoped>
.font-display {
  font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
}
</style>
