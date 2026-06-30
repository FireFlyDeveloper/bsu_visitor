<template>
  <div class="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <!-- Header -->
      <section
        class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div
          class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-[0.28em] text-red-700"
            >
              Guard House
            </p>
            <h1 class="mt-2 text-3xl font-bold text-slate-900">Visitor Kiosk</h1>
            <p class="mt-1 text-sm text-slate-500">
              Register a visitor at the school entrance. The destination office
              will see them in their dashboard.
            </p>
          </div>
          <div
            v-if="overdueCount > 0"
            class="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 ring-2 ring-rose-200 animate-pulse"
          >
            <span class="h-2 w-2 rounded-full bg-rose-500"></span>
            {{ overdueCount }} visitor{{ overdueCount === 1 ? "" : "s" }} need
            sign-out
          </div>
        </div>
      </section>

      <!-- Form -->
      <form
        @submit.prevent="onSubmit"
        class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
      >
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >Full name *</label
            >
            <input
              v-model="fullname"
              type="text"
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >Contact number *</label
            >
            <input
              v-model="contact_number"
              type="tel"
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Address *</label
          >
          <textarea
            v-model="address"
            rows="2"
            required
            class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20"
          ></textarea>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >Destination office *</label
            >
            <select
              v-model="office_id"
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20"
            >
              <option value="">Select office</option>
              <option v-for="o in offices" :key="o.id" :value="o.id">
                {{ o.office_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >Purpose</label
            >
            <input
              v-model="purpose"
              type="text"
              placeholder="e.g. inquiry, delivery, meeting"
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Visitor photo *</label
          >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            required
            @change="onFile"
            class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-red-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <img
            v-if="imgPreview"
            :src="imgPreview"
            class="mt-4 h-40 w-full rounded-2xl object-cover border border-slate-200"
            alt="Photo preview"
          />
        </div>

        <div
          v-if="error"
          class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-2xl bg-red-800 px-6 py-4 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? "Logging visitor..." : "Log visitor" }}
        </button>
      </form>

      <!-- Overdue sign-out panel -->
      <section
        v-if="overdue.length"
        class="rounded-3xl border-2 border-rose-200 bg-rose-50 p-6 shadow-sm"
      >
        <h2 class="text-lg font-bold text-rose-700">
          Pending sign-out ({{ overdue.length }})
        </h2>
        <p class="mt-1 text-sm text-rose-600">
          These visitors have been marked done by their office. Tap "Sign Out"
          when they leave the guard house.
        </p>
        <ul class="mt-4 space-y-3">
          <li
            v-for="log in overdue"
            :key="log.id"
            class="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm"
          >
            <img
              v-if="log.visitor_img"
              :src="`/${log.visitor_img}`"
              class="h-14 w-14 rounded-full object-cover"
            />
            <div
              v-else
              class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-500"
            >
              {{ (log.visitor_name || "?").charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-slate-900">{{ log.visitor_name }}</p>
              <p class="text-xs text-slate-500">
                {{ log.office_name }} · marked done
                {{ formatTime(log.time_out) }}
              </p>
            </div>
            <button
              @click="onSignOut(log)"
              :disabled="signingOut === log.id"
              class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {{ signingOut === log.id ? "..." : "Sign out" }}
            </button>
          </li>
        </ul>
      </section>
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
import KioskSuccessModal from "@/components/KioskSuccessModal.vue";

const officeStore = useOfficeStore();
const visitorLogStore = useVisitorLogStore();

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

let pollHandle = null;
let alarmAudio = null;
let alarmPlaying = false;

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

async function pollOverdue() {
  const data = await visitorLogStore.fetchOverdue();
  overdue.value = data.overdue || [];
  updateAlarm();
}

function updateAlarm() {
  if (!alarmAudio) return;
  if (overdue.value.length > 0 && !alarmPlaying) {
    alarmAudio.play().catch(() => {});
    alarmPlaying = true;
  } else if (overdue.value.length === 0 && alarmPlaying) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmPlaying = false;
  }
}

async function onSignOut(log) {
  signingOut.value = log.id;
  try {
    await visitorLogStore.signOutVisitor(log.id);
    await pollOverdue();
  } catch (err) {
    error.value = err?.message || "Sign-out failed";
  } finally {
    signingOut.value = null;
  }
}

function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString();
}

onMounted(async () => {
  await fetchOffices();
  // Only init audio after a user interaction (autoplay policy).
  // First poll kicks off the alarm if needed; if it does, audio will
  // silently fail until the first click — which is fine for a kiosk.
  alarmAudio = new Audio("/alarm.mp3");
  alarmAudio.loop = true;
  await pollOverdue();
  pollHandle = setInterval(pollOverdue, 5000);
});

onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle);
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }
  alarmPlaying = false;
});
</script>
