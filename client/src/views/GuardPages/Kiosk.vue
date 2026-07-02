<template>
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <!-- Header -->
      <header class="rise mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Guard house</p>
          <h1 class="mt-2 text-4xl font-bold tracking-tight">Visitor kiosk</h1>
          <p class="lede mt-2 max-w-xl">
            Register a visitor at the school entrance. The destination office
            will see them in their dashboard immediately.
          </p>
        </div>
        <div
          v-if="overdueCount > 0"
          class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 pulse-soft"
        >
          <span class="h-2 w-2 rounded-full bg-rose-500"></span>
          {{ overdueCount }} visitor{{ overdueCount === 1 ? "" : "s" }} need sign-out
        </div>
      </header>

      <!-- 2-col layout -->
      <div class="grid gap-6 lg:grid-cols-12">
        <!-- Form (col-span-7) -->
        <section class="surface rise lg:col-span-7 p-6 lg:p-8">
          <form @submit.prevent="onSubmit" class="space-y-5">
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="label" for="fullname">Full name *</label>
                <input id="fullname" v-model="fullname" type="text" required class="input" />
              </div>
              <div>
                <label class="label" for="contact">Contact number *</label>
                <input id="contact" v-model="contact_number" type="tel" required class="input" />
              </div>
            </div>

            <div>
              <label class="label" for="address">Address *</label>
              <textarea id="address" v-model="address" rows="2" required class="textarea"></textarea>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="label" for="office">Destination office *</label>
                <select id="office" v-model="office_id" required class="select">
                  <option value="">Select office</option>
                  <option v-for="o in offices" :key="o.id" :value="o.id">
                    {{ o.office_name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="label" for="purpose">Purpose</label>
                <input id="purpose" v-model="purpose" type="text" class="input" placeholder="Inquiry, delivery, meeting…" />
              </div>
            </div>

            <div>
              <label class="label" for="photo">Visitor photo *</label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                capture="environment"
                required
                @change="onFile"
                class="input file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ink)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
              <img
                v-if="imgPreview"
                :src="imgPreview"
                alt="Photo preview"
                class="mt-4 h-48 w-full rounded-2xl object-cover border border-[var(--line)]"
              />
            </div>

            <div
              v-if="error"
              class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {{ error }}
            </div>

            <AppButton type="submit" :loading="loading" block size="lg">
              {{ loading ? "Logging visitor…" : "Log visitor" }}
            </AppButton>
          </form>
        </section>

        <!-- Live activity feed (col-span-5) -->
        <section class="space-y-4 lg:col-span-5">
          <!-- Overdue (sticky) -->
          <div
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
          </div>

          <!-- Recent registrations (live) -->
          <div class="surface p-6 rise rise-delay-1">
            <div class="flex items-center justify-between">
              <div>
                <p class="eyebrow">Live feed</p>
                <p class="mt-1 text-xs text-[var(--ink-3)]">
                  Recent kiosk registrations
                </p>
              </div>
              <span class="flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-soft"></span>
                Auto-refresh
              </span>
            </div>
            <ul v-if="recentActivity.length" class="mt-4 space-y-2">
              <li
                v-for="(log, i) in recentActivity"
                :key="log.id"
                :class="stagger(i)"
                class="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-2.5"
              >
                <img
                  v-if="log.visitor_img"
                  :src="`/${log.visitor_img}`"
                  class="h-9 w-9 rounded-full object-cover"
                />
                <div
                  v-else
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper-2)] text-xs font-semibold text-[var(--ink-2)]"
                >
                  {{ (log.visitor_name || "?").charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">{{ log.visitor_name }}</p>
                  <p class="truncate text-xs text-[var(--ink-3)]">
                    {{ log.office_name }} · {{ log.purpose || "—" }}
                  </p>
                </div>
                <span class="shrink-0 font-mono text-[0.6875rem] tabular text-[var(--ink-3)]">
                  {{ formatTime(log.time_in) }}
                </span>
              </li>
            </ul>
            <EmptyState
              v-else
              icon="spark"
              title="No registrations yet"
              description="Once you log a visitor, it will appear here in real time."
            />
          </div>
        </section>
      </div>
    </div>

    <KioskSuccessModal
      :show="showSuccess"
      :message="successMessage"
      @close="closeSuccess"
      @register-another="registerAnother"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useOfficeStore } from "@/store/office.js";
import { useVisitorLogStore } from "@/store/visitorLog.js";
import { useToast } from "@/composables/useToast";
import { useSecurityAlarm } from "@/composables/useSecurityAlarm";
import AppButton from "@/components/AppButton.vue";
import EmptyState from "@/components/EmptyState.vue";
import KioskSuccessModal from "@/components/KioskSuccessModal.vue";
import { stagger } from "@/composables/useStagger";

const officeStore = useOfficeStore();
const visitorLogStore = useVisitorLogStore();
const toast = useToast();

const offices = ref([]);
const fullname = ref("");
const contact_number = ref("");
const address = ref("");
const office_id = ref("");
const purpose = ref("");
const file = ref(null);
const imgPreview = ref("");
const loading = ref(false);
const error = ref("");

const showSuccess = ref(false);
const successMessage = ref("");

const overdue = ref([]);
const overdueCount = computed(() => overdue.value.length);
const signingOut = ref(null);
const recentActivity = ref([]);

let pollHandle = null;

// Alarm audio + overdue polling are owned by the global
// `useSecurityAlarm` composable so the alarm plays on every
// security page, not just this one. Here we just refresh the
// local `overdue` list (for the inline panel) and the live feed.
const { refresh: refreshOverdue } = useSecurityAlarm();

async function fetchOffices() {
  await officeStore.fetchOffices();
  offices.value = officeStore.offices;
}

function onFile(event) {
  const selected = event.target.files?.[0];
  if (!selected) return;
  if (selected.size > 5 * 1024 * 1024) {
    error.value = "Photo must be under 5MB";
    return;
  }
  file.value = selected;
  imgPreview.value = URL.createObjectURL(selected);
}

function resetForm() {
  fullname.value = "";
  contact_number.value = "";
  address.value = "";
  office_id.value = "";
  purpose.value = "";
  file.value = null;
  imgPreview.value = "";
  error.value = "";
}

async function onSubmit() {
  loading.value = true;
  error.value = "";
  try {
    const fd = new FormData();
    fd.append("fullname", fullname.value);
    fd.append("contact_number", contact_number.value);
    fd.append("address", address.value);
    fd.append("office_id", office_id.value);
    fd.append("purpose", purpose.value);
    if (file.value) fd.append("img", file.value);

    const result = await visitorLogStore.kioskRegister(fd);
    const office = offices.value.find(
      (o) => Number(o.id) === Number(result.office_id),
    );
    successMessage.value = `${result.visitor.fullname} queued for ${
      office?.office_name || "office"
    }.`;
    showSuccess.value = true;
    toast.success(`Logged ${result.visitor.fullname}`);
    await pollAll();
  } catch (err) {
    error.value = err?.message || "Failed to log visitor";
  } finally {
    loading.value = false;
  }
}

function closeSuccess() {
  showSuccess.value = false;
  resetForm();
}
function registerAnother() {
  closeSuccess();
}

async function pollAll() {
  const [overdueRes, activityRes] = await Promise.all([
    visitorLogStore.fetchOverdue(),
    visitorLogStore.fetchVisitLogs({ perPage: 8, page: 1 }),
  ]);
  overdue.value = overdueRes.overdue || [];
  recentActivity.value = (activityRes.logs || []).slice(0, 8);
  // Tell the global alarm to re-evaluate the audio state based on
  // the latest count. The composable owns the Audio element.
  await refreshOverdue();
}

async function onSignOut(log) {
  signingOut.value = log.id;
  try {
    await visitorLogStore.signOutVisitor(log.id);
    toast.success(`${log.visitor_name} signed out`);
    await pollAll();
  } catch (err) {
    toast.error(err?.message || "Sign-out failed");
  } finally {
    signingOut.value = null;
  }
}

function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

onMounted(async () => {
  await fetchOffices();
  await pollAll();
  pollHandle = setInterval(pollAll, 5000);
});

onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle);
});
</script>
