<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="show"
      class="pointer-events-auto fixed bottom-4 right-4 z-[60] max-w-sm overflow-hidden rounded-2xl border-2 border-rose-300 bg-white shadow-2xl"
      role="alert"
      aria-live="assertive"
    >
      <div class="flex items-center gap-3 bg-rose-600 px-4 py-2.5 text-white">
        <span class="relative flex h-3 w-3">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
          <span class="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
        </span>
        <p class="text-sm font-bold uppercase tracking-wider">
          {{ overdueCount }} overdue
        </p>
        <button
          v-if="enabled"
          @click="acknowledge"
          class="ml-auto rounded-md bg-white/15 px-2 py-1 text-xs font-semibold hover:bg-white/25"
        >
          Mute
        </button>
        <button
          v-else
          @click="toggle"
          class="ml-auto rounded-md bg-white/15 px-2 py-1 text-xs font-semibold hover:bg-white/25"
        >
          Enable
        </button>
      </div>

      <ul class="max-h-64 divide-y divide-rose-100 overflow-y-auto">
        <li
          v-for="log in overdue.slice(0, 5)"
          :key="log.id"
          class="flex items-center gap-3 px-4 py-3 text-sm"
        >
          <img
            v-if="log.visitor_img"
            :src="`/${log.visitor_img}`"
            class="h-9 w-9 rounded-full object-cover"
            alt=""
          />
          <div
            v-else
            class="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700"
          >
            {{ (log.visitor_name || "?").charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-[var(--ink)]">
              {{ log.visitor_name }}
            </p>
            <p class="truncate text-xs text-[var(--ink-3)]">
              {{ log.office_name }}
              <span v-if="log.minutes_since_completed != null" class="ml-1 text-rose-600">
                · waiting {{ log.minutes_since_completed }}m
              </span>
            </p>
          </div>
          <button
            class="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
            :disabled="signingOut === log.id"
            @click="onSignOut(log)"
          >
            {{ signingOut === log.id ? "…" : "Sign out" }}
          </button>
        </li>
        <li
          v-if="overdue.length > 5"
          class="px-4 py-2 text-center text-xs text-[var(--ink-3)]"
        >
          + {{ overdue.length - 5 }} more
        </li>
      </ul>

      <div class="flex items-center justify-between border-t border-rose-100 bg-rose-50 px-4 py-2 text-[0.6875rem] text-rose-700">
        <span>
          <span class="font-semibold">Auto-refresh every 5s</span>
          <span v-if="lastUpdated" class="ml-2 text-rose-500/80">
            · {{ lastUpdated.toLocaleTimeString() }}
          </span>
        </span>
        <router-link
          to="/security/visitors/status"
          class="font-semibold underline-offset-2 hover:underline"
        >
          Open alarm dashboard →
        </router-link>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useSecurityAlarm } from "@/composables/useSecurityAlarm";
import { useVisitorLogStore } from "@/store/visitorLog";
import { useToast } from "@/composables/useToast";

const { overdue, overdueCount, enabled, lastUpdated, toggle, acknowledge } =
  useSecurityAlarm();
const store = useVisitorLogStore();
const toast = useToast();
const signingOut = ref(null);

const show = computed(() => overdueCount.value > 0);

async function onSignOut(log) {
  signingOut.value = log.id;
  try {
    await store.signOutVisitor(log.id);
    toast.success(`${log.visitor_name} signed out`);
    acknowledge();
  } catch (err) {
    toast.error(err?.message || "Sign-out failed");
  } finally {
    signingOut.value = null;
  }
}
</script>
