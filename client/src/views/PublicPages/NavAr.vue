<template>
  <div
    class="fixed inset-0 z-50 overflow-hidden text-white"
    :class="started || xrActive ? 'bg-transparent' : 'bg-black'"
  >
    <!-- Three.js WebXR canvas. During an immersive session the XR compositor
         owns the camera passthrough; keep the WebGL canvas alive but make the
         DOM element transparent so it cannot cover the camera feed. -->
    <canvas
      ref="canvasEl"
      class="absolute inset-0 h-full w-full"
      :class="xrActive ? 'pointer-events-none opacity-0' : 'opacity-0'"
    />

    <!-- ────── Top bar ────── -->
    <header
      class="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4"
    >
      <button
        @click="onClose"
        class="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
        aria-label="Back"
      >
        ←
      </button>
      <div
        class="rounded-2xl bg-black/40 px-4 py-2 text-sm font-semibold"
      >
        <div>
          <span class="text-white/70">Navigating to</span>
          <span class="ml-1 font-bold uppercase tracking-wider text-white">
            {{ officeName }}
          </span>
        </div>
        <div class="mt-0.5 font-mono text-[0.65rem] text-white/60">
          Map {{ MULTISET_MAP_ID }}
        </div>
      </div>
      <button
        @click="onClose"
        class="flex h-10 items-center justify-center rounded-full bg-black/40 px-3 text-sm font-semibold hover:bg-black/60"
      >
        Exit
      </button>
    </header>

    <!-- ────── Permission / start gate ────── -->
    <div
      v-if="!started"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 p-6 text-center"
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
        :disabled="starting || preparing || !arReady"
        class="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--bsu-red)] px-6 py-3 font-bold shadow-lg hover:bg-[#a30e22] disabled:opacity-60"
      >
        <span
          v-if="starting"
          class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
        />
        {{
          preparing
            ? "Preparing AR…"
            : starting
              ? "Starting AR…"
              : "Start AR navigation"
        }}
      </button>
    </div>

    <!-- ────── Bottom HUD ────── -->
    <footer
      v-if="started"
      class="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 p-4"
    >
      <!-- Distance + step indicators -->
      <div class="flex items-center gap-2">
        <span
          class="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold"
        >
          <span class="text-white/60">Mode</span>
          <span class="ml-1 text-white">AR</span>
        </span>
        <span
          class="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold"
        >
          <span class="text-white/60">Bearing</span>
          <span class="ml-1 font-mono text-white">
            {{ Math.round(displayBearing) }}°
          </span>
        </span>
        <span
          v-if="vpsActive"
          class="rounded-full bg-emerald-600/80 px-3 py-1 text-xs font-semibold"
        >
          VPS ✓
        </span>
      </div>
      <div
        class="max-w-[90vw] rounded-full bg-black/40 px-3 py-1 text-[0.65rem] font-medium text-white/80"
      >
        XR {{ xrActive ? "active" : "starting" }} · VPS
        {{ vpsActive ? "✓" : "localizing" }}
        <span v-if="errorMsg" class="text-rose-200"> · {{ errorMsg }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as THREE from "three";
import { MultisetClient, XRSessionManager } from "@multisetai/vps/core";
import { ThreeAdapter } from "@multisetai/vps/three";
import {
  MULTISET_AUTH_ENDPOINT,
  MULTISET_BROWSER_CLIENT_ID,
  MULTISET_FILE_ENDPOINT,
  MULTISET_MAP_DETAILS_ENDPOINT,
  MULTISET_MAP_ID,
  MULTISET_MAP_SET_DETAILS_ENDPOINT,
  MULTISET_QUERY_ENDPOINT,
  isMultisetConfigured,
} from "@/config/arNavigation";

const route = useRoute();
const router = useRouter();

const officeId = computed(() => Number(route.query.to || 0));
const officeName = computed(() => route.query.name || "your destination");

const canvasEl = ref(null);

const started = ref(false);
const starting = ref(false);
const preparing = ref(false);
const arReady = ref(false);
const errorMsg = ref("");
const xrActive = ref(false);
const displayBearing = ref(0); // final bearing shown in HUD

// Multiset VPS config. The map id is public and pinned for the BSU map.
// Real credentials stay server-side behind /api/multiset/token; the browser
// receives only a short-lived Multiset token.
const vpsActive = ref(false);
const vpsConfidence = ref(null);
let multisetClient = null;
let multisetSession = null;
let multisetAdapter = null;

// ── three.js core ─────────────────────────────────────────────────
let renderer, scene, camera, arrow, ring, clock;
let deviceHeading = 0; // compass heading from DeviceOrientationEvent

async function prepareAr() {
  if (arReady.value || preparing.value) return;

  preparing.value = true;
  errorMsg.value = "";
  try {
    if (typeof window === "undefined" || !window.isSecureContext) {
      throw new Error(
        "WebXR AR requires HTTPS, or http://localhost during development.",
      );
    }

    if (!isMultisetConfigured) {
      throw new Error("Multiset AR is not configured.");
    }

    if (typeof navigator === "undefined" || !navigator.xr) {
      throw new Error(
        "This browser does not expose WebXR AR. Use Chrome or Edge on an ARCore-capable Android device.",
      );
    }

    if (!(await ThreeAdapter.isSupported())) {
      throw new Error(
        "This device/browser does not support Multiset WebXR AR. Use Chrome or Edge on an ARCore-capable Android device over HTTPS.",
      );
    }

    await initThree();
    await setupMultisetVps();
    window.addEventListener("deviceorientation", onOrientation, true);
    arReady.value = true;
  } catch (err) {
    handleArError(err, "Could not prepare AR navigation.");
    cleanup();
  } finally {
    preparing.value = false;
  }
}

async function onStart() {
  starting.value = true;
  errorMsg.value = "";
  let sessionError = null;

  try {
    if (!arReady.value || !multisetAdapter) {
      throw new Error("AR is still preparing. Please try again in a moment.");
    }

    // startSession() must be called directly from this click handler. Do not
    // await token, camera, or renderer setup here or Chrome may reject WebXR
    // because the user-activation token has been consumed.
    await multisetAdapter.startSession();
    sessionError = lastSessionError;

    if (!multisetAdapter?.isActive()) {
      throw (
        sessionError ||
        new Error(
          "The WebXR AR session did not start. Check camera/AR permissions and try again.",
        )
      );
    }
  } catch (err) {
    handleArError(err, "Could not start AR navigation.");
    cleanup();
  } finally {
    starting.value = false;
  }
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
  renderer.setClearAlpha(0);
  renderer.xr.enabled = true;

  const gl = renderer.getContext();
  if (typeof gl.makeXRCompatible === "function") {
    await gl.makeXRCompatible();
  }

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

function updateSceneForFrame() {
  // Update arrow rotation to point at the destination.
  // Final bearing = (destination bearing - device heading) so the
  // arrow stays pointing the right way as the user turns the phone.
  if (vpsActive.value) {
    // VPS supplies an absolute bearing; subtract device compass.
    const target = vpsBearing.value - deviceHeading;
    arrow.rotation.y = THREE.MathUtils.degToRad(target);
    ring.rotation.y = THREE.MathUtils.degToRad(target);
    displayBearing.value = (vpsBearing.value + 360) % 360;
  }
}

// ── Multiset VPS SDK integration ─────────────────────────────────
const vpsBearing = ref(0);

let lastSessionError = null;

async function setupMultisetVps() {
  multisetClient = new MultisetClient({
    // Browser-safe placeholder identity. The backend owns the real Multiset
    // client id/secret and returns only a short-lived token from authUrl.
    clientId: MULTISET_BROWSER_CLIENT_ID,
    clientSecret: "server-side-token-proxy",
    mapType: "map",
    code: MULTISET_MAP_ID,
    isRightHanded: true,
    endpoints: {
      authUrl: MULTISET_AUTH_ENDPOINT,
      queryUrl: MULTISET_QUERY_ENDPOINT,
      mapDetailsUrl: MULTISET_MAP_DETAILS_ENDPOINT,
      mapSetDetailsUrl: MULTISET_MAP_SET_DETAILS_ENDPOINT,
      fileDownloadUrl: MULTISET_FILE_ENDPOINT,
    },
  });

  await multisetClient.authorize();

  multisetSession = new XRSessionManager(renderer.getContext(), {
    client: multisetClient,
    overlayRoot: document.body,
    autoLocalize: true,
    relocalization: true,
    confidenceCheck: true,
    confidenceThreshold: 0.5,
    onSessionStart: () => {
      started.value = true;
      xrActive.value = true;
      lastSessionError = null;
    },
    onSessionEnd: () => {
      started.value = false;
      xrActive.value = false;
      vpsActive.value = false;
    },
    onLocalizationResult: (result) => {
      vpsConfidence.value = result?.localizeData?.confidence ?? null;
    },
    onLocalizationFailure: (reason) => {
      console.warn("Multiset localization failed:", reason);
      vpsActive.value = false;
      errorMsg.value = describeArError(reason, "VPS localization failed. Move slowly and try again in the mapped area.");
    },
    onError: (error) => {
      lastSessionError = error;
      handleArError(error, "Multiset WebXR failed.");
    },
    onContextLost: () => {
      handleArError(
        "The WebGL context was lost. Restart AR navigation to continue.",
        "The WebGL context was lost.",
      );
    },
    onContextRestored: () => {
      errorMsg.value = "WebGL was restored. Tap Start AR navigation to restart.";
    },
  });

  multisetAdapter = new ThreeAdapter({
    session: multisetSession,
    renderer,
    scene,
    camera,
    showMesh: true,
    showGizmo: false,
    useDefaultButton: false,
    onLocalizationSuccess: (result, worldFromMap) => {
      vpsConfidence.value = result?.localizeData?.confidence ?? null;
      vpsActive.value = true;

      // Until office-specific map coordinates exist, place the destination
      // marker at map origin after VPS localization.
      const mapOrigin = new THREE.Vector3(0, 0, -3).applyMatrix4(worldFromMap);
      ring.position.copy(mapOrigin);
      arrow.position.copy(mapOrigin);
    },
    onXRFrame: () => {
      // ThreeAdapter renders the scene after this callback with its synced XR
      // camera. Rendering here as well causes duplicate/conflicting frame work.
      updateSceneForFrame();
    },
  });

  // Keep Three's XR manager explicitly enabled for compatibility checks while
  // still allowing Multiset's ThreeAdapter to own the actual session loop.
  renderer.xr.enabled = true;
  multisetAdapter.initialize();
}

async function localizeWithVps() {
  if (!multisetAdapter || multisetAdapter.isLocalizing) return;

  try {
    const result = await multisetAdapter.localizeFrame();
    if (!result) {
      vpsActive.value = false;
    }
  } catch (error) {
    console.warn("Multiset localization failed:", error);
    vpsActive.value = false;
    errorMsg.value = describeArError(error, "VPS localization failed. Move slowly and try again in the mapped area.");
  }
}

function describeArError(err, fallback) {
  if (typeof err === "string") return err;
  if (err?.message) return err.message;
  if (err?.name) return err.name;
  return fallback;
}

function handleArError(err, fallback) {
  console.warn("AR navigation error:", err);
  errorMsg.value = describeArError(err, fallback);
  started.value = false;
  xrActive.value = false;
  vpsActive.value = false;
}

function onClose() {
  cleanup();
  router.back();
}

function cleanup() {
  if (multisetAdapter) {
    multisetAdapter.dispose();
    multisetAdapter = null;
  }
  if (multisetSession) {
    multisetSession.dispose();
    multisetSession = null;
  }
  multisetClient = null;
  window.removeEventListener("deviceorientation", onOrientation);
  window.removeEventListener("resize", onResize);
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer = null;
  }
  arReady.value = false;
  started.value = false;
  xrActive.value = false;
  vpsActive.value = false;
  lastSessionError = null;
}

onBeforeUnmount(cleanup);

onMounted(() => {
  // Office id from query param — used by future backend hookup
  if (!officeId.value) {
    errorMsg.value = "No destination specified.";
    return;
  }

  void prepareAr();
});
</script>
