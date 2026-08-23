<template>
  <div class="mt-8 flex-1">
    <!-- Loading -->
    <div
      v-if="loading"
      class="flex justify-center rounded-3xl bg-white py-14 shadow-2xl"
    >
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--bsu-red)]/20 border-t-[var(--bsu-red)]"
      />
    </div>

    <!-- Office not found -->
    <div
      v-else-if="!office"
      class="rounded-3xl bg-white p-8 text-center text-[var(--bsu-ink)] shadow-2xl"
    >
      <p class="text-6xl">🚫</p>
      <h1 class="font-display mt-4 text-2xl font-bold">Office not found</h1>
      <p class="mt-2 text-sm text-[var(--bsu-ink-2)]">
        This link may be outdated. Please ask the guard for help.
      </p>
    </div>

    <!-- Success state -->
    <div
      v-else-if="submitted"
      class="rounded-3xl bg-white p-6 text-[var(--bsu-ink)] shadow-2xl"
    >
      <div class="flex items-center gap-4">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100"
        >
          <svg
            class="h-7 w-7 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="3"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 class="font-display text-2xl font-bold">
            {{ alreadyRegistered ? "Already registered" : "You're registered" }}
          </h1>
          <p class="text-sm text-[var(--bsu-ink-2)]">
            Please proceed to
            <span class="font-bold uppercase tracking-wider">
              {{ office.office_name }}
            </span>
            and wait to be called.
          </p>
        </div>
      </div>

      <div
        v-if="referenceNumber"
        class="mt-6 rounded-2xl border-2 border-[var(--bsu-line)] bg-[var(--bsu-paper-2)] p-5"
      >
        <p class="text-xs uppercase tracking-wider text-[var(--bsu-ink-3)]">
          Reference number
        </p>
        <p class="font-display mt-1 text-3xl font-bold tabular tracking-tight">
          {{ referenceNumber }}
        </p>
        <p
          v-if="queuePosition !== null"
          class="mt-2 text-sm text-[var(--bsu-ink-2)]"
        >
          You are
          <span class="font-bold text-[var(--bsu-red)]">
            #{{ queuePosition }}
          </span>
          in the queue.
        </p>
      </div>

      <div class="mt-6 grid gap-2 sm:grid-cols-2">
        <router-link
          :to="{ path: '/status', query: { token } }"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--bsu-red)] px-5 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.01] hover:bg-[#a30e22] active:scale-100"
        >
          Check my status
        </router-link>
        <router-link
          :to="{
            path: '/navigate',
            query: { to: office.id, name: office.office_name },
          }"
          class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--bsu-red)] px-5 py-3 text-base font-bold text-[var(--bsu-red)] shadow-lg transition-transform hover:scale-[1.01] active:scale-100"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 11l19-9-9 19-2-8-8-2z"
            />
          </svg>
          Navigate with AR →
        </router-link>
      </div>
    </div>

    <!-- Registration form -->
    <div v-else class="rounded-3xl bg-white p-6 text-[var(--bsu-ink)] shadow-2xl">
      <p
        class="eyebrow text-[0.65rem] font-bold uppercase tracking-widest text-[var(--bsu-red)]"
      >
        You're visiting
      </p>
      <h1
        class="font-display mt-2 text-3xl font-bold tracking-tight text-[var(--bsu-ink)]"
      >
        {{ capitalizeFirst(office.office_name) }}
      </h1>
      <p class="mt-2 text-sm text-[var(--bsu-ink-2)]">
        Fill in your details and take a quick photo to register your visit. The office will be notified.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <label class="block">
          <span class="form-label">Full name</span>
          <input
            v-model="form.fullname"
            type="text"
            class="form-input"
            placeholder="Juan Dela Cruz"
            required
            autocomplete="name"
          />
        </label>
        <label class="block">
          <span class="form-label">Contact number</span>
          <input
            v-model="form.contact_number"
            type="tel"
            class="form-input"
            placeholder="0917 123 4567"
            required
            autocomplete="tel"
            inputmode="tel"
          />
        </label>
        <label class="block">
          <span class="form-label">Address</span>
          <input
            v-model="form.address"
            type="text"
            class="form-input"
            placeholder="City, Province"
            required
            autocomplete="street-address"
          />
        </label>
        <label class="block">
          <span class="form-label">Purpose of visit (optional)</span>
          <textarea
            v-model="form.purpose"
            rows="2"
            class="form-input resize-none"
            placeholder="e.g. Inquire about enrollment"
          />
        </label>

        <!-- Required visitor ID photo -->
        <fieldset class="rounded-2xl border-2 p-4" :class="photo ? 'border-emerald-300 bg-emerald-50/40' : 'border-[var(--bsu-line)] bg-[var(--bsu-paper-2)]/40'">
          <legend class="px-1 text-xs font-bold uppercase tracking-wider text-[var(--bsu-ink-2)]">
            Visitor photo <span class="text-[var(--bsu-red)]">*</span>
          </legend>
          <p class="text-xs leading-5 text-[var(--bsu-ink-2)]">
            A clear front-facing photo is required, like a school ID picture.
          </p>

          <div v-if="photoPreview" class="mt-3 flex items-center gap-4">
            <img
              :src="photoPreview"
              alt="Your captured visitor photo"
              class="h-28 w-28 rounded-lg border-2 border-white object-cover shadow-md ring-1 ring-[var(--bsu-line)]"
            />
            <div class="flex flex-col gap-2">
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                Photo ready
              </span>
              <button type="button" class="text-xs font-semibold text-[var(--bsu-red)] underline underline-offset-2" @click="resetPhoto">
                Retake photo
              </button>
            </div>
          </div>

          <template v-else>
            <video
              v-show="cameraActive"
              ref="videoRef"
              class="mt-3 aspect-square w-full max-w-[16rem] rounded-xl bg-black object-cover"
              autoplay
              playsinline
              muted
            />
            <p v-if="cameraError" class="mt-2 text-xs font-medium text-red-600">{{ cameraError }}</p>

            <button
              v-if="!cameraActive && cameraSupported"
              type="button"
              class="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-[var(--bsu-red)] px-4 py-2.5 text-sm font-bold text-[var(--bsu-red)] transition hover:bg-[var(--bsu-red)] hover:text-white"
              @click="startCamera"
            >
              📷 Open camera
            </button>
            <p v-if="!cameraSupported" class="mt-2 text-xs font-medium text-red-600">
              This device has no camera available. Please register at the Security / Guard House kiosk instead.
            </p>
            <button
              v-else-if="cameraActive"
              type="button"
              class="mt-3 inline-flex w-full max-w-[16rem] items-center justify-center rounded-xl bg-[var(--bsu-red)] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#a30e22]"
              @click="captureFromCamera"
            >
              Capture photo
            </button>
          </template>
          <canvas ref="canvasRef" class="hidden" />
        </fieldset>

        <p
          v-if="formError"
          class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ formError }}
        </p>

        <button
          type="submit"
          :disabled="submitting"
          class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--bsu-red)] px-5 py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.01] hover:bg-[#a30e22] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            v-if="submitting"
            class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          {{ submitting ? "Registering…" : "Register visit" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { saveVisitorToken } from "@/utils/visitorToken";

const props = defineProps({
  office: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  showBack: { type: Boolean, default: false },
});

const emit = defineEmits(["back", "submitted"]);

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Office names may be stored lowercase (e.g. "cashier") — capitalize only
// the first letter so "Office of the Dean" keeps its natural casing.
function capitalizeFirst(name) {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : name;
}

const formError = ref("");
const submitting = ref(false);
const submitted = ref(false);
const alreadyRegistered = ref(false);
const token = ref("");
const referenceNumber = ref("");
const queuePosition = ref(null);

const form = reactive({
  fullname: "",
  contact_number: "",
  address: "",
  purpose: "",
});

// --- Required visitor photo (camera capture with upload fallback) ---
const videoRef = ref(null);
const canvasRef = ref(null);
const cameraSupported = !!navigator.mediaDevices?.getUserMedia;
const cameraActive = ref(false);
const cameraError = ref("");
const photo = ref(null); // Blob sent as multipart "photo"
const photoPreview = ref("");
let cameraStream = null;

function setPhotoBlob(blob) {
  photo.value = blob;
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
  photoPreview.value = URL.createObjectURL(blob);
}

function resetPhoto() {
  stopCamera();
  photo.value = null;
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
  photoPreview.value = "";
}
function onCameraUnavailable() {
  cameraError.value =
    "This device has no camera available. Please register at the Security / Guard House kiosk instead.";
}

async function startCamera() {
  cameraError.value = "";
  if (!navigator.mediaDevices?.getUserMedia) {
    onCameraUnavailable();
    return;
  }
  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" } },
        audio: false,
      });
    } catch (_) {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    cameraStream = stream;
    cameraActive.value = true;
    await new Promise((r) => setTimeout(r, 0)); // let <video> mount (v-show)
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play().catch(() => {});
    }
  } catch (err) {
    stopCamera();
    cameraError.value =
      err?.name === "NotAllowedError"
        ? "Camera permission was denied. Allow camera access in your browser and try again."
        : "Unable to open the camera. Please register at the Security / Guard House kiosk instead.";
  }
}

function stopCamera() {
  cameraStream?.getTracks().forEach((t) => t.stop());
  cameraStream = null;
  cameraActive.value = false;
}

function captureFromCamera() {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (!video || !canvas || !video.videoWidth) {
    cameraError.value = "Camera is still starting. Please try again.";
    return;
  }
  const size = Math.min(video.videoWidth, video.videoHeight);
  canvas.width = 480;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  // Center-crop the video frame to a square ID-style photo.
  ctx.drawImage(
    video,
    (video.videoWidth - size) / 2,
    (video.videoHeight - size) / 2,
    size,
    size,
    0,
    0,
    480,
    480,
  );
  canvas.toBlob((blob) => {
    if (!blob) {
      cameraError.value = "Failed to capture. Please try again.";
      return;
    }
    setPhotoBlob(blob);
    stopCamera();
  }, "image/jpeg", 0.9);
}

onMounted(() => window.addEventListener("pagehide", stopCamera));
onBeforeUnmount(() => {
  window.removeEventListener("pagehide", stopCamera);
  stopCamera();
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
});

async function onSubmit() {
  formError.value = "";
  if (!photo.value) {
    formError.value = "A visitor photo is required before registering.";
    return;
  }
  submitting.value = true;
  try {
    const body = new FormData();
    body.append("fullname", form.fullname.trim());
    body.append("contact_number", form.contact_number.trim());
    body.append("address", form.address.trim());
    body.append("purpose", form.purpose.trim());
    body.append("photo", photo.value, "visitor-photo.jpg");

    const res = await fetch(
      `${API_BASE}/public/office/${props.office.id}/register`,
      { method: "POST", body },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      formError.value = data.error || "Registration failed. Please try again.";
      return;
    }
    token.value = data.token || "";
    referenceNumber.value = data.reference_number || "";
    queuePosition.value =
      typeof data.queue_position === "number" ? data.queue_position : null;
    alreadyRegistered.value = !!data.already_registered;

    // Persist the opaque token in a long-lived cookie so the /status page can
    // find this visit later — even after closing the browser. Only this
    // device holds the raw token; the backend stores only its hash.
    if (token.value) {
      saveVisitorToken(token.value);
    }
    submitted.value = true;
    emit("submitted");
  } catch (e) {
    formError.value = "Network error. Please check your connection.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.eyebrow {
  letter-spacing: 0.12em;
}
.font-display {
  font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
}
.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--bsu-ink-2);
  margin-bottom: 0.35rem;
}
.form-input {
  width: 100%;
  border-radius: 0.6rem;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.7rem 0.9rem;
  font-size: 0.95rem;
  color: var(--bsu-ink);
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.form-input:focus {
  border-color: var(--bsu-red);
  background: #fff;
}
</style>
