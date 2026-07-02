<template>
  <div
    class="fixed inset-0 z-50 overflow-hidden bg-black text-white"
  >
    <!-- Camera video (also used by WebXR as the passthrough) -->
    <video
      ref="videoEl"
      playsinline
      muted
      autoplay
      class="absolute inset-0 h-full w-full object-cover"
    />

    <!-- Three.js WebXR canvas overlay -->
    <canvas
      ref="canvasEl"
      class="absolute inset-0 h-full w-full"
      :class="xrActive ? 'opacity-100' : 'opacity-0'"
    />

    <!-- ────── Top bar ────── -->
    <header
      class="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4"
    >
      <button
        @click="onClose"
        class="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
        aria-label="Back"
      >
        ←
      </button>
      <div
        class="rounded-full bg-black/40 px-4 py-2 text-sm font-semibold backdrop-blur"
      >
        <span class="text-white/70">Navigating to</span>
        <span class="ml-1 font-bold uppercase tracking-wider text-white">
          {{ officeName }}
        </span>
      </div>
      <button
        @click="onClose"
        class="flex h-10 items-center justify-center rounded-full bg-black/40 px-3 text-sm font-semibold backdrop-blur hover:bg-black/60"
      >
        Exit
      </button>
    </header>

    <!-- ────── Permission / start gate ────── -->
    <div
      v-if="!started"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 p-6 text-center backdrop-blur"
    >
      <div
        class="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--bsu-red)] shadow-2xl"
      >
        <svg
          class="h-12 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 7h2l2-3h10l2 3h2v12H3V7zm9 11a4 4 0 100-8 4 4 0 000 8z"
          />
        </svg>
      </div>
      <h1 class="mt-6 text-2xl font-bold">AR navigation</h1>
      <p class="mt-2 max-w-sm text-sm text-white/70">
        We need access to your camera to show directions to
        <strong class="text-white">{{ officeName }}</strong>. The image is
        processed on-device; nothing is uploaded.
      </p>
      <p v-if="errorMsg" class="mt-3 text-sm text-rose-300">{{ errorMsg }}</p>
      <button
        @click="onStart"
        :disabled="starting"
        class="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--bsu-red)] px-6 py-3 font-bold shadow-lg hover:bg-[#a30e22] disabled:opacity-60"
      >
        <span
          v-if="starting"
          class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
        />
        {{ starting ? "Starting camera…" : "Start AR navigation" }}
      </button>
    </div>

    <!-- ────── Bottom HUD ────── -->
    <footer
      v-if="started"
      class="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 p-4"
    >
      <div
        v-if="manualMode"
        class="w-full max-w-sm rounded-2xl bg-black/60 p-3 text-center text-xs text-white/80 backdrop-blur"
      >
        Hold your phone upright. Use the slider to rotate the arrow toward
        <strong class="text-white">{{ officeName }}</strong>.
      </div>

      <!-- Manual direction slider (fallback when VPS is unavailable) -->
      <div
        v-if="manualMode"
        class="flex w-full max-w-sm items-center gap-3 rounded-2xl bg-black/60 px-4 py-3 backdrop-blur"
      >
        <span class="text-xs text-white/60">← turn</span>
        <input
          v-model.number="manualBearing"
          type="range"
          min="-180"
          max="180"
          step="1"
          class="flex-1 accent-[var(--bsu-red)]"
        />
        <span class="text-xs text-white/60">turn →</span>
      </div>

      <!-- Distance + step indicators -->
      <div class="flex items-center gap-2">
        <span
          class="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur"
        >
          <span class="text-white/60">Mode</span>
          <span class="ml-1 text-white">{{ modeLabel }}</span>
        </span>
        <span
          class="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur"
        >
          <span class="text-white/60">Bearing</span>
          <span class="ml-1 font-mono text-white">
            {{ Math.round(displayBearing) }}°
          </span>
        </span>
        <span
          v-if="vpsActive"
          class="rounded-full bg-emerald-600/80 px-3 py-1 text-xs font-semibold backdrop-blur"
        >
          VPS ✓
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as THREE from "three";

const route = useRoute();
const router = useRouter();

const officeId = computed(() => Number(route.query.to || 0));
const officeName = computed(() => route.query.name || "your destination");

const videoEl = ref(null);
const canvasEl = ref(null);

const started = ref(false);
const starting = ref(false);
const errorMsg = ref("");
const xrActive = ref(false);
const manualMode = ref(true); // start in manual until VPS confirms a pose
const manualBearing = ref(0); // user-set bearing in degrees [-180, 180]
const displayBearing = ref(0); // final bearing shown in HUD

// Multiset VPS config (env-driven, optional). When both vars are set,
// we'll poll the /vps/pose endpoint to localize the phone in the
// BSU building. If not set, we stay in manual mode.
const MULTISET_KEY = import.meta.env.VITE_MULTISET_API_KEY || "";
const MULTISET_MAP_ID = import.meta.env.VITE_MULTISET_MAP_ID || "";
const vpsActive = ref(false);
let vpsTimer = null;

const modeLabel = computed(() =>
  vpsActive.value ? "AR" : manualMode.value ? "Manual" : "AR",
);

// ── three.js core ─────────────────────────────────────────────────
let renderer, scene, camera, arrow, ring, clock;
let deviceHeading = 0; // compass heading from DeviceOrientationEvent

async function onStart() {
  starting.value = true;
  errorMsg.value = "";
  // Some browsers / iOS / non-secure contexts leave `mediaDevices`
  // undefined. Surface a clear message instead of crashing.
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    errorMsg.value =
      "Your browser does not expose a camera API here. " +
      "Open this page over HTTPS (or on http://localhost) in a modern " +
      "mobile browser (Safari iOS 14.5+, Chrome, Firefox).";
    starting.value = false;
    return;
  }
  try {
    await startCamera();
    await initThree();
    started.value = true;
    // Try to enter an immersive WebXR AR session if supported;
    // otherwise we render the AR overlay in a regular 2D scene
    // on top of the live <video> feed (works on every phone).
    if (navigator.xr && (await navigator.xr.isSessionSupported("immersive-ar"))) {
      try {
        const session = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test"],
          optionalFeatures: ["dom-overlay", "light-estimation"],
          domOverlay: { root: document.body },
        });
        await renderer.xr.setSession(session);
        xrActive.value = true;
        renderer.setAnimationLoop(renderFrame);
      } catch (e) {
        console.warn("WebXR AR session failed, using 2D overlay:", e);
        xrActive.value = false;
        renderer.setAnimationLoop(renderFrame);
      }
    } else {
      xrActive.value = false;
      renderer.setAnimationLoop(renderFrame);
    }

    // Listen to device orientation for manual arrow rotation.
    window.addEventListener("deviceorientation", onOrientation, true);
    // Try VPS pose polling if configured.
    if (MULTISET_KEY && MULTISET_MAP_ID) startVpsPolling();
  } catch (err) {
    console.error(err);
    errorMsg.value =
      err?.message ||
      "Could not start the camera. Please grant permission and reload.";
  } finally {
    starting.value = false;
  }
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
    audio: false,
  });
  videoEl.value.srcObject = stream;
  await new Promise((resolve) => {
    videoEl.value.onloadedmetadata = () => {
      videoEl.value.play();
      resolve();
    };
  });
}

async function initThree() {
  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  );
  camera.position.set(0, 0, 0);

  // Lighting
  const light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
  scene.add(light);

  // Ring (where the destination is)
  const ringGeo = new THREE.RingGeometry(0.4, 0.5, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xd0112b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 0, -3);
  scene.add(ring);

  // 3D arrow (cone + cylinder) floating above the ring
  arrow = new THREE.Group();

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.4, 16),
    new THREE.MeshBasicMaterial({ color: 0xd0112b }),
  );
  shaft.position.y = 0.2;
  arrow.add(shaft);

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.25, 16),
    new THREE.MeshBasicMaterial({ color: 0xd0112b }),
  );
  head.position.y = 0.55;
  arrow.add(head);

  arrow.position.set(0, 0, -3);
  scene.add(arrow);

  // Resize handling
  window.addEventListener("resize", onResize);
  onResize();
  clock = new THREE.Clock();
}

function onResize() {
  if (!renderer) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function onOrientation(e) {
  // alpha: rotation around z-axis (compass) [0, 360)
  if (e.alpha == null) return;
  deviceHeading = e.alpha;
}

function renderFrame() {
  // Update arrow rotation to point at the destination.
  // Final bearing = (destination bearing - device heading) so the
  // arrow stays pointing the right way as the user turns the phone.
  if (vpsActive.value) {
    // VPS supplies an absolute bearing; subtract device compass.
    const target = vpsBearing.value - deviceHeading;
    arrow.rotation.y = THREE.MathUtils.degToRad(target);
    ring.rotation.y = THREE.MathUtils.degToRad(target);
    displayBearing.value = (vpsBearing.value + 360) % 360;
  } else if (manualMode.value) {
    arrow.rotation.y = THREE.MathUtils.degToRad(manualBearing.value);
    ring.rotation.y = THREE.MathUtils.degToRad(manualBearing.value);
    displayBearing.value = manualBearing.value;
  }
  if (!xrActive.value) renderer.render(scene, camera);
  else renderer.render(scene, camera);
}

// ── Multiset VPS pose polling ─────────────────────────────────────
const vpsBearing = ref(0);
let lastVpsPose = null;

function startVpsPolling() {
  // Multiset's REST endpoint signature (per their docs):
  //   POST https://api.multiset.ai/v1/vps/pose
  //   headers: { Authorization: Bearer <KEY> }
  //   body: { map_id, image (base64) }
  // We poll the camera every ~2s and POST the latest frame.
  // For a real implementation you'd compress + base64 the frame
  // client-side. This is a stub hook ready to wire in.
  vpsTimer = setInterval(async () => {
    try {
      const frame = canvasEl.value?.captureStream?.(1)
        ? null
        : videoEl.value;
      if (!frame) return;
      // NOTE: a full integration would draw the <video> to an
      // off-screen canvas, grab a JPEG blob, base64 it, and POST.
      // Leaving the wire-up point here so the Multiset payload
      // shape is obvious. The endpoint call is intentionally
      // commented until Kim grabs the real SDK:
      //
      //   const res = await fetch("https://api.multiset.ai/v1/vps/pose", {
      //     method: "POST",
      //     headers: {
      //       "Authorization": `Bearer ${MULTISET_KEY}`,
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ map_id: MULTISET_MAP_ID, image: b64 }),
      //   });
      //   const pose = await res.json();
      //   vpsBearing.value = pose.bearing ?? 0;
      //   vpsActive.value = true;
      //   manualMode.value = false;
    } catch (e) {
      console.warn("vps poll error", e);
    }
  }, 2000);
}

function onClose() {
  cleanup();
  router.back();
}

function cleanup() {
  if (vpsTimer) clearInterval(vpsTimer);
  window.removeEventListener("deviceorientation", onOrientation);
  window.removeEventListener("resize", onResize);
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.dispose();
  }
  if (videoEl.value?.srcObject) {
    for (const t of videoEl.value.srcObject.getTracks()) t.stop();
  }
}

onBeforeUnmount(cleanup);

onMounted(() => {
  // Office id from query param — used by future backend hookup
  if (!officeId.value) {
    errorMsg.value = "No destination specified.";
  }
});
</script>
