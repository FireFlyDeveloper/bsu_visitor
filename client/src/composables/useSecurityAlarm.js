import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useVisitorLogStore } from "@/store/visitorLog";

/**
 * Global security alarm — plays /alarm.mp3 and shows a floating banner
 * on every page when a visit is overdue (status='completed' AND
 * left_at IS NULL AND > N minutes since time_out).
 *
 * Survives SPA route changes because:
 *   - The store is module-level (singleton).
 *   - The Audio element is module-level (one element, never garbage-collected
 *     while the tab is alive).
 *   - The poll handle is module-level.
 *
 * Used by:
 *   - Kiosk.vue            (visitor registration)
 *   - VisitorStatus.vue    (alarm dashboard)
 *   - OfficeStatus.vue     (office availability)
 *   - SecurityPanel layout (so even on other security pages the alarm fires)
 *
 * Optional: drop a <SecurityAlarmWidget /> in the AdminLayout so the
 * floating "Overdue — Sign out now" banner shows on every page.
 */

let audio = null;
let pollHandle = null;
let pollSeconds = 5;

// Module-level reactive state shared across all callers
const overdue = ref([]);
const overdueCount = computed(() => overdue.value.length);
const enabled = ref(true);
const lastUpdated = ref(null);
const polling = ref(false);

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio("/alarm.mp3");
  audio.loop = true;
  audio.preload = "auto";
  return audio;
}

function play() {
  if (!enabled.value) return;
  ensureAudio().play().catch(() => {
    // Autoplay policies: first user gesture unlocks audio. The widget's
    // "Acknowledge" button counts as a gesture and resumes playback.
  });
}

function stop() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

async function poll() {
  if (polling.value) return;
  polling.value = true;
  try {
    const store = useVisitorLogStore();
    const data = await store.fetchOverdue();
    overdue.value = data.overdue || [];
    lastUpdated.value = new Date();

    if (overdue.value.length > 0) {
      play();
    } else {
      stop();
    }
  } catch (err) {
    // Swallow — the next poll will retry.
    console.warn("alarm poll error", err);
  } finally {
    polling.value = false;
  }
}

function start() {
  if (pollHandle) return;
  poll();
  pollHandle = setInterval(poll, pollSeconds * 1000);
}

function stop_() {
  if (!pollHandle) return;
  clearInterval(pollHandle);
  pollHandle = null;
  stop();
}

function toggle() {
  enabled.value = !enabled.value;
  if (!enabled.value) stop();
  else if (overdue.value.length > 0) play();
}

function acknowledge() {
  // Same as stop() but the user explicitly cleared it. We do NOT disable
  // the alarm — it will re-trigger on the next poll if new overdue rows
  // appear, which is the desired security behavior.
  stop();
  // Re-check immediately so the banner disappears even before the next
  // 5s tick.
  poll();
}

export function useSecurityAlarm() {
  // Start polling on first use; subsequent calls reuse the same handle.
  start();

  return {
    overdue,
    overdueCount,
    enabled,
    lastUpdated,
    polling,
    toggle,
    acknowledge,
    refresh: poll,
  };
}

/**
 * Optional composable to tear down the alarm on logout / role change.
 * No-op if the alarm was never started.
 */
export function stopSecurityAlarm() {
  stop_();
}
