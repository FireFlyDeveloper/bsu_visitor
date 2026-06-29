<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useVisitorLogStore } from "@/store/visitorLog";

const store = useVisitorLogStore();

// Load saved alarm minutes from localStorage, default to 30
const alarmMinutes = ref(
  parseInt(localStorage.getItem("visitor_alarm_minutes") || "30"),
);

const now = ref(Date.now());

const alarmAudio = new Audio("/alarm.mp3");
const alarmEnabled = ref(true);

// Save alarm minutes to localStorage whenever it changes
watch(alarmMinutes, (newValue) => {
  localStorage.setItem("visitor_alarm_minutes", newValue);
});

// Compute time spent with seconds precision
function computeTimeSpent(log) {
  const start = new Date(log.time_in);
  const end = log.time_out ? new Date(log.time_out) : new Date(now.value);

  const diffMs = end - start;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  return {
    minutes,
    seconds,
    totalMs: diffMs,
    formatted: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    display:
      minutes >= 60
        ? `${Math.floor(minutes / 60)}h ${minutes % 60}m ${seconds}s`
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

// Filter out "left" status and compute time
const logsWithTime = computed(() => {
  return store.logs
    .filter((log) => log.status !== "left")
    .map((log) => {
      const timeSpent = computeTimeSpent(log);

      return {
        ...log,
        ...timeSpent,
        isAlarm: timeSpent.minutes >= Number(alarmMinutes.value),
      };
    });
});

// Prevent alarm spam
let alarmPlayed = false;

watch(
  logsWithTime,
  (logs) => {
    if (!alarmEnabled.value) return;

    const hasAlarm = logs.some((l) => l.isAlarm);

    if (hasAlarm && !alarmPlayed) {
      alarmAudio.play().catch(() => {});
      alarmPlayed = true;
    }

    if (!hasAlarm) {
      alarmPlayed = false;
    }
  },
  { deep: true },
);

// Mark as left
async function markAsLeft(log) {
  try {
    await fetch(`/api/visitor-status/${log.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        status: "left",
      }),
    });

    store.logs = store.logs.filter((l) => l.id !== log.id);
  } catch (err) {
    console.error("Failed to mark as left:", err);
  }
}

// Format minutes for display
const formatMinutes = (minutes) => {
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} hr${hours !== 1 ? "s" : ""} ${mins > 0 ? `${mins} min` : ""}`;
};

// Get progress percentage for progress bar
const getProgressPercentage = (minutes) => {
  const threshold = Number(alarmMinutes.value);
  if (minutes >= threshold) return 100;
  return (minutes / threshold) * 100;
};

let timer;

onMounted(() => {
  store.fetchVisitLogs();

  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000); // Update every second for live seconds counter
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
            Visitor Status
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Monitor active visitors and receive time-based alerts
          </p>
        </div>
        <!-- Live Indicator -->
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
            ></span>
          </span>
          Live updates every 1s
        </div>
      </div>
    </div>

    <!-- Control Panel -->
    <div
      class="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
    >
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-slate-700"
            >Alarm Threshold:</label
          >
          <div class="relative">
            <input
              type="number"
              v-model="alarmMinutes"
              min="1"
              class="w-28 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-center"
            />
            <span
              class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none"
            >
              min
            </span>
          </div>
          <div class="text-xs text-slate-400">(Saved to browser)</div>
        </div>

        <div class="h-8 w-px bg-slate-200 hidden sm:block"></div>

        <button
          @click="toggleAlarm"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="
            alarmEnabled
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
              : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
          "
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {{ alarmEnabled ? "Stop Alarm" : "Enable Alarm" }}
        </button>

        <div
          v-if="alarmEnabled"
          class="flex items-center gap-2 text-xs text-slate-500"
        >
          <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Alarm active ({{ alarmMinutes }} min threshold)
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div
      class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <!-- Loading Overlay -->
      <div v-if="store.loading" class="relative">
        <div
          class="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <div class="flex flex-col items-center gap-2">
            <div
              class="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin"
            ></div>
            <span class="text-sm text-slate-500">Loading visitors...</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!store.loading && logsWithTime.length === 0"
        class="py-16 text-center"
      >
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4"
        >
          <svg
            class="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p class="text-slate-500 font-medium">No active visitors</p>
        <p class="text-sm text-slate-400 mt-1">
          All visitors have been marked as left
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/50">
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Visitor
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Office
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Purpose
              </th>
              <th class="px-6 py-3.5 text-left font-semibold text-slate-700">
                Time Spent
              </th>
              <th class="px-6 py-3.5 text-center font-semibold text-slate-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="log in logsWithTime"
              :key="log.id"
              class="group transition-all duration-150"
              :class="
                log.isAlarm
                  ? 'bg-gradient-to-r from-red-50 to-transparent'
                  : 'hover:bg-slate-50'
              "
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center"
                  >
                    <span class="text-red-700 font-medium text-xs">
                      {{ log.visitor_name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <div class="font-semibold text-slate-800">
                      {{ log.visitor_name }}
                    </div>
                    <div class="text-xs text-slate-500">
                      {{ log.contact_number || "No contact" }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5">
                  <svg
                    class="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span class="text-slate-600">{{ log.office_name }}</span>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="max-w-xs text-slate-600 truncate">
                  {{ log.purpose || "-" }}
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <div class="relative">
                      <svg
                        class="w-5 h-5"
                        :class="
                          log.isAlarm
                            ? 'text-red-500 animate-pulse'
                            : 'text-slate-400'
                        "
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span
                        v-if="log.isAlarm"
                        class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"
                      ></span>
                    </div>
                    <span
                      class="font-mono font-bold"
                      :class="
                        log.isAlarm
                          ? 'text-red-600 text-base'
                          : 'text-slate-700'
                      "
                    >
                      {{ log.display }}
                    </span>
                  </div>

                  <!-- Progress bar for time visualization -->
                  <div
                    class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="log.isAlarm ? 'bg-red-500' : 'bg-blue-500'"
                      :style="{
                        width: `${getProgressPercentage(log.minutes)}%`,
                      }"
                    ></div>
                  </div>

                  <div class="text-xs text-slate-400">
                    {{ log.formatted }} / {{ alarmMinutes }} min threshold
                  </div>
                </div>
              </td>

              <td class="px-6 py-4 text-center">
                <button
                  @click="markAsLeft(log)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                  Mark Left
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
