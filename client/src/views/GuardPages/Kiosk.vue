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
              <label class="label">Visitor photo *</label>
              <div class="rounded-2xl border border-[var(--line)] bg-white p-3">
                <div
                  v-if="cameraActive"
                  class="overflow-hidden rounded-xl border border-[var(--line)] bg-black"
                >
                  <video
                    ref="videoRef"
                    autoplay
                    muted
                    playsinline
                    class="h-64 w-full object-cover"
                  ></video>
                </div>
                <img
                  v-else-if="imgPreview"
                  :src="imgPreview"
                  alt="Captured visitor photo preview"
                  class="h-64 w-full rounded-xl border border-[var(--line)] object-cover"
                />
                <div
                  v-else
                  class="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper-2)] px-4 text-center"
                >
                  <p class="text-sm font-semibold text-[var(--ink)]">No visitor photo yet</p>
                  <p class="mt-1 max-w-sm text-xs text-[var(--ink-3)]">
                    Open the device camera and capture a clear photo before logging the visitor.
                  </p>
                </div>

                <canvas ref="canvasRef" class="hidden"></canvas>

                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    v-if="!cameraActive && !imgPreview"
                    type="button"
                    class="btn btn-primary btn-sm"
                    :disabled="cameraStarting"
                    @click="startCamera"
                  >
                    {{ cameraStarting ? "Opening camera…" : "Open camera" }}
                  </button>
                  <button
                    v-if="cameraActive"
                    type="button"
                    class="btn btn-primary btn-sm"
                    @click="capturePhoto"
                  >
                    Capture photo
                  </button>
                  <button
                    v-if="cameraActive"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="stopCamera"
                  >
                    Close camera
                  </button>
                  <button
                    v-if="imgPreview"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="retakePhoto"
                  >
                    Retake photo
                  </button>
                </div>

                <p
                  v-if="cameraError"
                  class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                >
                  {{ cameraError }}
                </p>
              </div>
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
                class="rounded-xl border border-[var(--line)] bg-white p-1"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-[var(--paper-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bsu-red)]"
                  title="Show visitor QR"
                  @click="openQrModal(log)"
                >
                  <img
                    v-if="log.visitor_img"
                    :src="visitorImageUrl(log.visitor_img)"
                    class="h-9 w-9 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--paper-2)] text-xs font-semibold text-[var(--ink-2)]"
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
                  <span
                    v-if="log.qrToken"
                    class="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--bsu-red)]/30 bg-[var(--bsu-red-soft)] px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--bsu-red)]"
                  >
                    <QrCode class="h-3 w-3" aria-hidden="true" />
                    QR
                  </span>
                </button>
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
      :qr-value="successQrValue"
      :office-name="successOfficeName"
      :reference-number="successReferenceNumber"
      :visitor-name="successVisitorName"
      @close="closeSuccess"
      @register-another="registerAnother"
    />

    <KioskQrModal
      :show="showQrModal"
      :entry="qrModalEntry"
      @close="closeQrModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { useOfficeStore } from "@/store/office.js";
import { useVisitorLogStore } from "@/store/visitorLog.js";
import { useToast } from "@/composables/useToast";
import { useSecurityAlarm } from "@/composables/useSecurityAlarm";
import AppButton from "@/components/AppButton.vue";
import EmptyState from "@/components/EmptyState.vue";
import KioskSuccessModal from "@/components/KioskSuccessModal.vue";
import KioskQrModal from "@/components/KioskQrModal.vue";
import { QrCode } from "@lucide/vue";
import { stagger } from "@/composables/useStagger";
import { visitorImageUrl } from "@/utils/visitorImageUrl";
import { cacheKioskQr, getCachedKioskQr, attachCachedQrs } from "@/utils/guardQrCache";
import { formatServerTime } from "@/utils/dateTime";

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
const videoRef = ref(null);
const canvasRef = ref(null);
const cameraActive = ref(false);
const cameraStarting = ref(false);
const cameraError = ref("");
const loading = ref(false);
const error = ref("");

const showSuccess = ref(false);
const successMessage = ref("");
const successQrValue = ref("");
const successOfficeName = ref("");
const successReferenceNumber = ref("");
const successVisitorName = ref("");

const showQrModal = ref(false);
const qrModalEntry = ref(null);

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

function revokePreview() {
  if (imgPreview.value) {
    URL.revokeObjectURL(imgPreview.value);
  }
  imgPreview.value = "";
}

function stopCamera() {
  const stream = videoRef.value?.srcObject;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    videoRef.value.srcObject = null;
  }
  cameraActive.value = false;
  cameraStarting.value = false;
}

async function startCamera() {
  cameraError.value = "";

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value =
      "This browser does not support camera capture. Use a device and browser with camera access.";
    return;
  }

  stopCamera();
  cameraStarting.value = true;

  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" } },
        audio: false,
      });
    } catch (frontCameraError) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    }

    cameraActive.value = true;
    await nextTick();

    if (!videoRef.value) {
      stream.getTracks().forEach((track) => track.stop());
      cameraActive.value = false;
      return;
    }

    videoRef.value.srcObject = stream;
    await videoRef.value.play();
  } catch (err) {
    stopCamera();
    cameraError.value = cameraErrorMessage(err);
  } finally {
    cameraStarting.value = false;
  }
}

function cameraErrorMessage(err) {
  if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
    return "Camera permission was denied. Allow camera access in the browser and try again.";
  }
  if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
    return "No usable camera was found on this device.";
  }
  if (err?.name === "NotReadableError") {
    return "The camera is already in use by another app or browser tab.";
  }
  return "Unable to open the camera. Check device permissions and try again.";
}

function capturePhoto() {
  const video = videoRef.value;
  const canvas = canvasRef.value;

  if (!video || !canvas || !cameraActive.value) {
    cameraError.value = "Open the camera before capturing a photo.";
    return;
  }

  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    cameraError.value = "Camera preview is still loading. Please try again in a moment.";
    return;
  }

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, width, height);

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        cameraError.value = "Failed to capture the photo. Please try again.";
        return;
      }

      revokePreview();
      const photoFile = new File([blob], `visitor-photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      if (photoFile.size > 5 * 1024 * 1024) {
        cameraError.value = "Captured photo must be under 5MB. Please retake it.";
        file.value = null;
        stopCamera();
        return;
      }

      file.value = photoFile;
      imgPreview.value = URL.createObjectURL(blob);
      cameraError.value = "";
      stopCamera();
    },
    "image/jpeg",
    0.9,
  );
}

function retakePhoto() {
  file.value = null;
  revokePreview();
  startCamera();
}

function resetForm() {
  fullname.value = "";
  contact_number.value = "";
  address.value = "";
  office_id.value = "";
  purpose.value = "";
  file.value = null;
  revokePreview();
  cameraError.value = "";
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
    if (!file.value) {
      throw new Error("Capture a visitor photo before logging the visitor");
    }
    fd.append("img", file.value);

    const result = await visitorLogStore.kioskRegister(fd);
    const office = offices.value.find(
      (o) => Number(o.id) === Number(result.office_id),
    );
    const officeName = office?.office_name || "office";
    successMessage.value = `${result.visitor.fullname} queued for ${officeName}.`;
    successQrValue.value = `${
      import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin
    }/status?token=${result.token}`;
    successOfficeName.value = officeName;
    successReferenceNumber.value = result.reference_number || "";
    successVisitorName.value = result.visitor.fullname || "";
    // Keep the raw token on this kiosk device so the recent-registrations
    // feed can re-show the visitor's QR after the success modal closes.
    // (Backend stores only the hash — this cache is the only replay source.)
    cacheKioskQr({
      logId: result.logId,
      token: result.token,
      office: officeName,
      reference: result.reference_number || "",
      name: result.visitor.fullname || "",
    });
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
  successQrValue.value = "";
  successOfficeName.value = "";
  successReferenceNumber.value = "";
  successVisitorName.value = "";
  resetForm();
}
function registerAnother() {
  closeSuccess();
}

/** Open the QR re-view modal for a recent kiosk registration. */
function openQrModal(log) {
  if (!log) return;
  const cached = getCachedKioskQr(log.id);
  qrModalEntry.value = {
    ...log,
    qrToken: log.qrToken || cached?.token || "",
    reference: log.reference_number || cached?.reference || "",
    office: log.office_name || cached?.office || "",
    name: log.visitor_name || cached?.name || "",
  };
  showQrModal.value = true;
}
function closeQrModal() {
  showQrModal.value = false;
  qrModalEntry.value = null;
}

async function pollAll() {
  const [overdueRes, activityRes] = await Promise.all([
    visitorLogStore.fetchOverdue(),
    visitorLogStore.fetchVisitLogs({ perPage: 8, page: 1 }),
  ]);
  overdue.value = overdueRes.overdue || [];
  recentActivity.value = attachCachedQrs(activityRes.logs || []).slice(0, 8);
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
  return formatServerTime(value);
}

onMounted(async () => {
  await fetchOffices();
  await pollAll();
  pollHandle = setInterval(pollAll, 5000);
});

onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle);
  stopCamera();
  revokePreview();
});
</script>
