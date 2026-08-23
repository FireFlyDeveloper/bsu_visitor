<template>
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <header class="rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Security</p>
          <h1 class="mt-2 text-4xl font-bold tracking-tight">Visitor status</h1>
          <p class="lede mt-2 max-w-xl">
            Active visitors across the campus. Live counter updates every second.
          </p>
        </div>
        <div class="flex items-center gap-2 text-xs text-[var(--ink-3)]">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
          Live · every 1s
        </div>
      </header>

      <!-- Controls -->
      <section class="surface rise rise-delay-1 p-5">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-3">
            <label class="text-sm font-semibold text-[var(--ink-2)]">Alarm threshold</label>
            <div class="relative">
              <input
                type="number"
                v-model.number="alarmMinutes"
                min="1"
                class="input w-24 text-center tabular"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-3)] pointer-events-none">min</span>
            </div>
          </div>
          <div class="h-6 w-px bg-[var(--line)] hidden sm:block"></div>
          <button class="btn" :class="alarmEnabled ? 'btn-danger' : 'btn-success'" @click="toggleAlarm">
            {{ alarmEnabled ? "Stop alarm" : "Enable alarm" }}
          </button>
          <span v-if="alarmEnabled" class="text-xs text-[var(--ink-3)]">
            <span class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500 pulse-soft"></span>
            Alarm active · {{ alarmMinutes }} min
          </span>
        </div>
      </section>

      <!-- Overdue panel -->
      <section
        v-if="overdue.length"
        class="surface-raised p-6 ring-1 ring-rose-200 rise"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="eyebrow text-rose-700">Pending sign-out</p>
            <p class="font-display mt-1 text-2xl font-bold tabular">
              {{ overdue.length }}
            </p>
          </div>
          <span class="h-2.5 w-2.5 rounded-full bg-rose-500 pulse-soft"></span>
        </div>
        <ul class="mt-4 space-y-2">
          <li
            v-for="(log, i) in overdue"
            :key="log.id"
            :class="stagger(i)"
            class="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-2.5"
          >
            <img
              v-if="log.visitor_img"
              :src="visitorImageUrl(log.visitor_img)"
              class="h-10 w-10 rounded-full object-cover"
            />
            <div
              v-else
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--paper-2)] text-sm font-semibold text-[var(--ink-2)]"
            >
              {{ (log.visitor_name || "?").charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ log.visitor_name }}</p>
              <p class="truncate text-xs text-[var(--ink-3)]">
                {{ log.office_name }} · {{ formatTime(log.time_out) }}
              </p>
            </div>
            <button
              class="btn btn-danger btn-sm"
              :disabled="signingOut === log.id"
              @click="onSignOut(log)"
            >
              {{ signingOut === log.id ? "…" : "Sign out" }}
            </button>
          </li>
        </ul>
      </section>

      <!-- Active table -->
      <section class="surface rise rise-delay-2 overflow-hidden">
        <div class="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <p class="text-sm text-[var(--ink-2)]">
            <span class="font-semibold text-[var(--ink)] tabular">{{ logsWithTime.length }}</span>
            active
          </p>
        </div>
        <div v-if="store.loading && !logsWithTime.length" class="p-6 space-y-2">
          <Skeleton v-for="i in 5" :key="i" height="56" />
        </div>
        <EmptyState
          v-else-if="!logsWithTime.length"
          icon="users"
          title="No active visitors"
          description="All visitors have been marked done and signed out."
        />
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--line)] bg-[var(--paper-2)]/40 text-left text-[0.6875rem] uppercase tracking-wider text-[var(--ink-3)]">
                <th class="px-6 py-3 font-semibold">Visitor</th>
                <th class="px-6 py-3 font-semibold">Office</th>
                <th class="px-6 py-3 font-semibold">Purpose</th>
                <th class="px-6 py-3 font-semibold">Time on site</th>
                <th class="px-6 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--line)]">
              <tr
                v-for="log in logsWithTime"
                :key="log.id"
                class="transition-colors"
                :class="log.isAlarm ? 'bg-rose-50/40' : 'hover:bg-[var(--paper-2)]/40'"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <img
                      v-if="log.visitor_img"
                      :src="visitorImageUrl(log.visitor_img)"
                      class="h-9 w-9 rounded-full object-cover"
                      alt=""
                    />
                    <div
                      v-else
                      class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper-2)] text-sm font-semibold text-[var(--ink-2)]"
                    >
                      {{ (log.visitor_name || "?").charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-semibold">{{ log.visitor_name }}</p>
                      <p class="text-xs text-[var(--ink-3)] tabular">{{ log.contact_number || "No contact" }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-[var(--ink-2)]">{{ log.office_name }}</td>
                <td class="px-6 py-4 max-w-xs truncate text-[var(--ink-2)]">{{ log.purpose || "—" }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-mono font-bold tabular"
                      :class="log.isAlarm ? 'text-rose-600' : 'text-[var(--ink-2)]'"
                    >{{ log.display }}</span>
                    <div class="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--paper-2)]">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="log.isAlarm ? 'bg-rose-500' : 'bg-sky-500'"
                        :style="{ width: getProgressPercentage(log.minutes) + '%' }"
                      />
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <button
                    v-if="log.status === 'completed'"
                    class="btn btn-secondary btn-sm"
                    :disabled="signingOut === log.id"
                    @click="markAsLeft(log)"
                  >{{ signingOut === log.id ? "…" : "Mark left" }}</button>
                  <span
                    v-else-if="log.status === 'pending'"
                    class="text-xs font-semibold uppercase tracking-wide text-[var(--ink-3)]"
                    title="The office has not accepted this visitor yet"
                  >
                    Awaiting office
                  </span>
                  <span
                    v-else
                    class="text-xs font-semibold uppercase tracking-wide text-amber-600"
                    title="The office is still processing this visit"
                  >
                    In progress
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useVisitorLogStore } from "@/store/visitorLog";
import { useToast } from "@/composables/useToast";
import { useSecurityAlarm } from "@/composables/useSecurityAlarm";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { stagger } from "@/composables/useStagger";
import { visitorImageUrl } from "@/utils/visitorImageUrl";
import { elapsedFromServerTime, formatServerTime } from "@/utils/dateTime";

const store = useVisitorLogStore();
const toast = useToast();
const { refresh: refreshOverdue } = useSecurityAlarm();

const alarmMinutes = ref(parseInt(localStorage.getItem("visitor_alarm_minutes") || "30"));
const now = ref(Date.now());
const alarmEnabled = ref(true);

const overdue = ref([]);
const overdueCount = computed(() => overdue.value.length);
const signingOut = ref(null);

// Audio element is owned by the global useSecurityAlarm composable
// (mounted in the AdminLayout). The page-level "active table" alarm
// trigger (a row's time-on-site crossing the threshold) delegates to
// the composable so the same audio plays regardless of which page
// the guard is currently on.
let activePollHandle = null;

watch(alarmMinutes, (v) => localStorage.setItem("visitor_alarm_minutes", String(v)));

function computeTimeSpent(log) {
  return elapsedFromServerTime(log.time_in, new Date(now.value));
}

function toggleAlarm() {
  alarmEnabled.value = !alarmEnabled.value;
  // Toggle handled at the composable level when we refresh below.
}

const logsWithTime = computed(() =>
  store.logs
    .filter((log) => !log.left_at && log.status !== "left")
    .map((log) => {
      const t = computeTimeSpent(log);
      return { ...log, ...t, isAlarm: t.minutes >= Number(alarmMinutes.value) };
    }),
);

// Active table alarm trigger delegates to the global composable so
// the same audio plays on kiosk, office-status, etc.
watch(
  logsWithTime,
  async (logs) => {
    if (!alarmEnabled.value) return;
    const hasAlarm =
      logs.some((l) => l.isAlarm) || overdue.value.length > 0;
    if (hasAlarm) {
      // Force a re-poll so the composable starts the audio.
      await refreshOverdue();
    }
  },
  { deep: true },
);

async function markAsLeft(log) {
  await onSignOut(log);
}

function getProgressPercentage(minutes) {
  const threshold = Number(alarmMinutes.value);
  if (minutes >= threshold) return 100;
  return (minutes / threshold) * 100;
}

function formatTime(value) {
  return formatServerTime(value);
}

async function pollOverdue() {
  const data = await store.fetchOverdue();
  overdue.value = data.overdue || [];
  // Sync the global composable so audio state is consistent across pages.
  await refreshOverdue();
}

async function onSignOut(log) {
  signingOut.value = log.id;
  try {
    await store.signOutVisitor(log.id);
    toast.success(`${log.visitor_name} signed out`);
    await pollOverdue();
    await store.fetchActiveVisitors();
  } catch (err) {
    // Surface the backend's reason (e.g. "office has not marked this visit done").
    toast.error(err?.message || "Sign-out failed");
  } finally {
    signingOut.value = null;
  }
}

let timer;
onMounted(() => {
  store.fetchActiveVisitors();
  timer = setInterval(() => { now.value = Date.now(); }, 1000);
  pollOverdue();
  activePollHandle = setInterval(async () => {
    await Promise.all([pollOverdue(), store.fetchActiveVisitors()]);
  }, 5000);
});

onUnmounted(() => {
  clearInterval(timer);
  if (activePollHandle) clearInterval(activePollHandle);
  // Don't pause audio here — the composable owns it and it may need
  // to keep playing if the user navigates to a different security page.
});
</script>
