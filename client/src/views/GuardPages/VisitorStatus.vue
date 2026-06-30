<template>
  <Navbar />
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
              :src="`/${log.visitor_img}`"
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
                    <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper-2)] text-sm font-semibold text-[var(--ink-2)]">
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
                    class="btn btn-secondary btn-sm"
                    @click="markAsLeft(log)"
                  >Mark left</button>
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
import Navbar from "@/components/Navbar.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { stagger } from "@/composables/useStagger";

const store = useVisitorLogStore();
const toast = useToast();

const alarmMinutes = ref(parseInt(localStorage.getItem("visitor_alarm_minutes") || "30"));
const now = ref(Date.now());
const alarmEnabled = ref(true);

const overdue = ref([]);
const overdueCount = computed(() => overdue.value.length);
const signingOut = ref(null);
let overduePollHandle = null;

const alarmAudio = new Audio("/alarm.mp3");
let alarmPlayed = false;

watch(alarmMinutes, (v) => localStorage.setItem("visitor_alarm_minutes", String(v)));

function computeTimeSpent(log) {
  const start = new Date(log.time_in);
  const end = log.time_out ? new Date(log.time_out) : new Date(now.value);
  const diffMs = end - start;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return {
    minutes,
    seconds,
    formatted: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    display: minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : `${minutes}m ${seconds}s`,
  };
}

function toggleAlarm() {
  alarmEnabled.value = !alarmEnabled.value;
  if (!alarmEnabled.value) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmPlayed = false;
  }
}

const logsWithTime = computed(() =>
  store.logs
    .filter((log) => log.status !== "left")
    .map((log) => {
      const t = computeTimeSpent(log);
      return { ...log, ...t, isAlarm: t.minutes >= Number(alarmMinutes.value) };
    }),
);

watch(logsWithTime, (logs) => {
  if (!alarmEnabled.value) return;
  const hasAlarm = logs.some((l) => l.isAlarm) || overdue.value.length > 0;
  if (hasAlarm && !alarmPlayed) {
    alarmAudio.play().catch(() => {});
    alarmPlayed = true;
  }
  if (!hasAlarm) alarmPlayed = false;
}, { deep: true });

async function markAsLeft(log) {
  try {
    await fetch(`/api/visitor-status/${log.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status: "left" }),
    });
    store.logs = store.logs.filter((l) => l.id !== log.id);
    toast.success(`${log.visitor_name} marked left`);
  } catch (err) {
    toast.error("Could not mark left");
  }
}

function getProgressPercentage(minutes) {
  const threshold = Number(alarmMinutes.value);
  if (minutes >= threshold) return 100;
  return (minutes / threshold) * 100;
}

function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function pollOverdue() {
  const data = await store.fetchOverdue();
  overdue.value = data.overdue || [];
  if (overdue.value.length > 0 && alarmEnabled.value && !alarmPlayed) {
    alarmAudio.play().catch(() => {});
    alarmPlayed = true;
  } else if (overdue.value.length === 0 && !logsWithTime.value.some((l) => l.isAlarm)) {
    alarmPlayed = false;
  }
}

async function onSignOut(log) {
  signingOut.value = log.id;
  try {
    await store.signOutVisitor(log.id);
    toast.success(`${log.visitor_name} signed out`);
    await pollOverdue();
    await store.fetchVisitLogs();
  } catch (err) {
    toast.error("Sign-out failed");
  } finally {
    signingOut.value = null;
  }
}

let timer;
onMounted(() => {
  store.fetchVisitLogs();
  timer = setInterval(() => { now.value = Date.now(); }, 1000);
  pollOverdue();
  overduePollHandle = setInterval(pollOverdue, 5000);
});

onUnmounted(() => {
  clearInterval(timer);
  if (overduePollHandle) clearInterval(overduePollHandle);
  alarmAudio.pause();
});
</script>
