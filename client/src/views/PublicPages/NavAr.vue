<template>
  <div
    class="fixed inset-0 z-50 overflow-hidden text-white"
    :class="started || xrActive ? 'bg-transparent' : 'bg-[#0b0b0d]'"
  >
    <!-- Three.js WebXR canvas. During an immersive session the XR compositor
         owns the camera passthrough; keep the WebGL canvas alive but make the
         DOM element transparent so it cannot cover the camera feed. -->
    <canvas
      ref="canvasEl"
      class="absolute inset-0 h-full w-full"
      :class="xrActive ? 'pointer-events-none opacity-0' : 'opacity-0'"
    />

    <div
      v-if="!xrActive"
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(208,17,43,0.34),transparent_34%),linear-gradient(180deg,#161316_0%,#08080a_100%)]"
      aria-hidden="true"
    />

    <!-- Top bar -->
    <header
      class="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5"
    >
      <button
        @click="onClose"
        class="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/12 bg-black/48 text-white shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur transition hover:bg-black/62 active:translate-y-px"
        aria-label="Go back"
      >
        <ArrowLeft class="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        class="min-w-0 flex-1 rounded-3xl border border-white/12 bg-black/46 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.24)] backdrop-blur"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--bsu-red)] text-white">
            <MapPinned class="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-white/62">Navigating to</p>
            <p class="truncate text-base font-bold leading-tight tracking-tight text-white">
              {{ officeName }}
            </p>
            <p class="mt-1 font-mono text-[0.68rem] text-white/54">
              Map {{ MULTISET_MAP_ID }}
            </p>
          </div>
        </div>
      </div>
      <button
        @click="onClose"
        class="flex min-h-11 items-center justify-center rounded-2xl border border-white/12 bg-black/48 px-4 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur transition hover:bg-black/62 active:translate-y-px"
      >
        Exit
      </button>
    </header>

    <!-- Permission / start gate -->
    <div
      v-if="!started"
      class="absolute inset-0 z-20 flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm"
    >
      <section class="w-full max-w-md rounded-[2rem] border border-white/12 bg-white/[0.08] p-5 text-left shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur sm:p-6">
        <div class="flex items-start gap-4">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[var(--bsu-red)] shadow-[0_14px_34px_rgba(208,17,43,0.36)]"
          >
            <Camera class="h-7 w-7" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-white/58">
              Camera permission
            </p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight !text-white">
              Start AR when you are on campus.
            </h1>
          </div>
        </div>

        <p class="mt-4 text-sm leading-6 text-white/74">
          We use your camera to localize the route to
          <strong class="font-semibold text-white">{{ officeName }}</strong>.
          Frames stay on your device and the route marker appears only after VPS finds the mapped area.
        </p>

        <div class="mt-5 grid gap-2 text-sm text-white/72">
          <div class="flex items-start gap-2 rounded-2xl bg-white/[0.07] px-3 py-2">
            <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            <span>Camera opens after you tap the button.</span>
          </div>
          <div class="flex items-start gap-2 rounded-2xl bg-white/[0.07] px-3 py-2">
            <ScanLine class="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            <span>Move slowly while localization is starting.</span>
          </div>
        </div>

        <p
          v-if="errorMsg"
          class="mt-4 rounded-2xl border border-rose-300/28 bg-rose-500/16 px-3 py-2 text-sm leading-5 text-rose-100"
        >
          {{ errorMsg }}
        </p>

        <button
          @click="onStart"
          :disabled="starting || preparing || !arReady"
          class="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--bsu-red)] px-5 text-base font-bold text-white shadow-[0_18px_42px_rgba(208,17,43,0.34)] transition hover:bg-[var(--bsu-red-deep)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-62"
        >
          <span
            v-if="starting || preparing"
            class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
          {{
            preparing
              ? "Preparing AR"
              : starting
                ? "Starting AR"
                : "Start AR navigation"
          }}
        </button>

        <p class="mt-3 text-center text-xs leading-5 text-white/52">
          If the button is disabled, AR setup is still checking your browser and device support.
        </p>
      </section>
    </div>

    <!-- Bottom HUD -->
    <footer
      v-if="started"
      class="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 px-4 pb-4 sm:pb-5"
    >
      <div class="flex max-w-[94vw] flex-wrap items-center justify-center gap-2">
        <span
          class="inline-flex min-h-9 items-center gap-1.5 rounded-2xl border border-white/12 bg-black/50 px-3 text-xs font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur"
        >
          <Navigation class="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
          AR mode
        </span>
        <span
          class="inline-flex min-h-9 items-center gap-1.5 rounded-2xl border border-white/12 bg-black/50 px-3 text-xs font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur"
        >
          <Compass class="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
          <span class="font-mono text-white">
            {{ Math.round(displayBearing) }}°
          </span>
        </span>
        <span
          class="inline-flex min-h-9 items-center gap-1.5 rounded-2xl border px-3 text-xs font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur"
          :class="vpsActive ? 'border-emerald-300/35 bg-emerald-600/82 text-white' : localizationFailed ? 'border-rose-300/35 bg-rose-600/82 text-white' : 'border-white/12 bg-black/50 text-white/80'"
        >
          <ScanLine class="h-3.5 w-3.5" aria-hidden="true" />
          {{ vpsActive ? "VPS localized" : localizationFailed ? "Localization failed" : "Localizing" }}
        </span>
      </div>
      <div
        class="max-w-[94vw] rounded-2xl border border-white/12 bg-black/48 px-3 py-2 text-center text-xs font-medium leading-5 text-white/76 shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur"
      >
        {{ localizationFailed ? "Move to the mapped area, keep the camera steady, then retry localization." : "Keep the phone steady and follow the red pathway after localization." }}
        <span v-if="errorMsg" class="block text-rose-100">{{ errorMsg }}</span>
        <button
          v-if="localizationFailed"
          @click="retryLocalization"
          :disabled="retryingLocalization"
          class="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--bsu-red)] px-4 text-sm font-bold text-white shadow-[0_14px_32px_rgba(208,17,43,0.28)] transition hover:bg-[var(--bsu-red-deep)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-62"
        >
          <span
            v-if="retryingLocalization"
            class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
          {{ retryingLocalization ? "Retrying" : "Retry localization" }}
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  Camera,
  Compass,
  MapPinned,
  Navigation,
  ScanLine,
  ShieldCheck,
} from "@lucide/vue";
import * as THREE from "three";
import { MultisetClient, XRSessionManager } from "@multisetai/vps/core";
import { ThreeAdapter } from "@multisetai/vps/three";
import {
  AR_PATHWAY_POINTS,
  MULTISET_AUTH_ENDPOINT,
  MULTISET_BROWSER_CLIENT_ID,
  MULTISET_FILE_ENDPOINT,
  MULTISET_MAP_DETAILS_ENDPOINT,
  MULTISET_MAP_ID,
  MULTISET_MAP_SET_DETAILS_ENDPOINT,
  MULTISET_QUERY_ENDPOINT,
  findArDestination,
  isMultisetConfigured,
} from "@/config/arNavigation";

const route = useRoute();
const router = useRouter();

const officeId = computed(() => route.query.to || "");
const officeName = computed(() => route.query.name || "your destination");
const selectedDestination = computed(() =>
  findArDestination({ id: officeId.value, name: officeName.value }),
);

const canvasEl = ref(null);

const started = ref(false);
const starting = ref(false);
const preparing = ref(false);
const arReady = ref(false);
const errorMsg = ref("");
const xrActive = ref(false);
const displayBearing = ref(0); // final bearing shown in HUD
const localizationFailed = ref(false);
const retryingLocalization = ref(false);

// Multiset VPS config. The map id is public and pinned for the BSU map.
// Real credentials stay server-side behind /api/multiset/token; the browser
// receives only a short-lived Multiset token.
const vpsActive = ref(false);
const vpsConfidence = ref(null);
let multisetClient = null;
let multisetSession = null;
let multisetAdapter = null;

// ── three.js core ─────────────────────────────────────────────────
let renderer, scene, camera, navGroup, pathGroup, userConnectorLine, destinationConnectorLine, destinationLabelSprite;
let hasDestinationWorldPosition = false;
let hasPathwayWorldPoints = false;
let destinationPathwayIndex = -1;
let deviceHeading = 0; // compass heading from DeviceOrientationEvent

const userWorldPosition = new THREE.Vector3();
const destinationWorldPosition = new THREE.Vector3();
const pathwayWorldPoints = [];
const routeWorldPoints = [];
const pathMidpoint = new THREE.Vector3();
const pathDirection = new THREE.Vector3();
const pathUp = new THREE.Vector3(0, 1, 0);
const pathwayMaterial = new THREE.MeshBasicMaterial({
  color: 0xd0112b,
  transparent: true,
  opacity: 0.96,
  depthTest: false,
});

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

  // Navigation content follows the official Multiset example pattern:
  // create the 3D group during setup, keep it hidden, then reveal/place it
  // only after VPS returns a successful localization pose.
  navGroup = new THREE.Group();
  navGroup.visible = false;
  scene.add(navGroup);

  // Primary route path. Use a thin cylinder instead of THREE.Line because
  // mobile WebGL/WebXR commonly ignores line thickness hints.
  pathGroup = new THREE.Group();
  pathGroup.visible = false;
  scene.add(pathGroup);

  userConnectorLine = createPathSegmentMesh();
  userConnectorLine.visible = false;
  scene.add(userConnectorLine);

  destinationConnectorLine = createPathSegmentMesh();
  destinationConnectorLine.visible = false;
  scene.add(destinationConnectorLine);

  destinationLabelSprite = createDestinationLabelSprite(officeName.value);
  destinationLabelSprite.visible = false;
  scene.add(destinationLabelSprite);

  // Resize handling
  window.addEventListener("resize", onResize);
  onResize();
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

function hideNavigationPath() {
  hasDestinationWorldPosition = false;
  hasPathwayWorldPoints = false;
  destinationPathwayIndex = -1;
  pathwayWorldPoints.length = 0;
  routeWorldPoints.length = 0;
  if (navGroup) navGroup.visible = false;
  if (pathGroup) pathGroup.visible = false;
  if (userConnectorLine) userConnectorLine.visible = false;
  if (destinationConnectorLine) destinationConnectorLine.visible = false;
  if (destinationLabelSprite) destinationLabelSprite.visible = false;
}

function createDestinationLabelTexture(label) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = 512;
  const height = 160;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.scale(dpr, dpr);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(8, 8, 10, 0.88)";
  roundRect(context, 18, 26, width - 36, 92, 30);
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.26)";
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = "#d0112b";
  roundRect(context, 36, 46, 18, 52, 9);
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = "700 34px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, width / 2 + 14, 72, width - 116);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function createDestinationLabelSprite(label) {
  const texture = createDestinationLabelTexture(label);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.frustumCulled = false;
  sprite.renderOrder = 1001;
  sprite.scale.set(1.9, 0.6, 1);
  return sprite;
}

function updateDestinationLabel(label, position) {
  if (!destinationLabelSprite) return;

  destinationLabelSprite.material.map?.dispose();
  destinationLabelSprite.material.map = createDestinationLabelTexture(label);
  destinationLabelSprite.material.needsUpdate = true;
  destinationLabelSprite.position.copy(position).add(new THREE.Vector3(0, 1.05, 0));
  destinationLabelSprite.visible = true;
}

function createPathSegmentMesh() {
  const geometry = new THREE.CylinderGeometry(0.06, 0.06, 1, 16, 1, true);
  const segment = new THREE.Mesh(geometry, pathwayMaterial);
  segment.frustumCulled = false;
  segment.renderOrder = 1000;
  return segment;
}

function placeSegment(segment, start, end) {
  pathDirection.subVectors(end, start);
  const distance = pathDirection.length();
  if (distance < 0.08) {
    segment.visible = false;
    return;
  }

  pathMidpoint.copy(start).add(end).multiplyScalar(0.5);
  segment.position.copy(pathMidpoint);
  segment.scale.set(1, distance, 1);
  segment.quaternion.setFromUnitVectors(pathUp, pathDirection.normalize());
  segment.visible = true;
}

function findNearestPathwayIndex(position) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  pathwayWorldPoints.forEach((point, index) => {
    const distance = point.distanceToSquared(position);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function rebuildPathwaySegments(points = routeWorldPoints) {
  if (!pathGroup) return;

  pathGroup.clear();
  for (let i = 0; i < points.length - 1; i += 1) {
    const segment = createPathSegmentMesh();
    placeSegment(segment, points[i], points[i + 1]);
    pathGroup.add(segment);
  }
  pathGroup.visible = points.length > 1;
}

function updateNavigationPath() {
  if (
    !vpsActive.value ||
    !hasDestinationWorldPosition ||
    !hasPathwayWorldPoints ||
    !camera ||
    !pathGroup ||
    !userConnectorLine ||
    !destinationConnectorLine
  ) {
    if (pathGroup) pathGroup.visible = false;
    if (userConnectorLine) userConnectorLine.visible = false;
    if (destinationConnectorLine) destinationConnectorLine.visible = false;
    return;
  }

  camera.getWorldPosition(userWorldPosition);
  const userPathwayIndex = findNearestPathwayIndex(userWorldPosition);
  const startIndex = Math.min(userPathwayIndex, destinationPathwayIndex);
  const endIndex = Math.max(userPathwayIndex, destinationPathwayIndex);
  routeWorldPoints.length = 0;
  routeWorldPoints.push(...pathwayWorldPoints.slice(startIndex, endIndex + 1));

  if (userPathwayIndex > destinationPathwayIndex) {
    routeWorldPoints.reverse();
  }

  rebuildPathwaySegments(routeWorldPoints);
  placeSegment(userConnectorLine, userWorldPosition, routeWorldPoints[0]);
  placeSegment(
    destinationConnectorLine,
    routeWorldPoints[routeWorldPoints.length - 1],
    destinationWorldPosition,
  );
  pathGroup.visible = routeWorldPoints.length > 1;
}

function updateSceneForFrame() {
  // Keep the pathway updated from the current XR camera/user pose.
  displayBearing.value = (vpsBearing.value + 360) % 360;
  updateNavigationPath();
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
      vpsActive.value = false;
      localizationFailed.value = false;
      hideNavigationPath();
      lastSessionError = null;
    },
    onSessionEnd: () => {
      started.value = false;
      xrActive.value = false;
      vpsActive.value = false;
      localizationFailed.value = false;
      hideNavigationPath();
    },
    onLocalizationInit: () => {
      localizationFailed.value = false;
      errorMsg.value = "";
    },
    onLocalizationResult: (result) => {
      vpsConfidence.value = result?.localizeData?.confidence ?? null;
    },
    onLocalizationFailure: (reason) => {
      console.warn("Multiset localization failed:", reason);
      vpsActive.value = false;
      localizationFailed.value = true;
      hideNavigationPath();
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
    showMesh: false,
    showGizmo: false,
    useDefaultButton: false,
    onLocalizationSuccess: (result, worldFromMap) => {
      vpsConfidence.value = result?.localizeData?.confidence ?? null;
      vpsActive.value = true;
      localizationFailed.value = false;
      errorMsg.value = "";

      // Official Multiset example behavior: keep the 3D group hidden until
      // localization succeeds, then apply the returned map-to-world pose and
      // reveal it at the selected office's real Multiset map coordinate.
      if (!navGroup) return;

      const destination = selectedDestination.value;
      if (!destination) {
        hideNavigationPath();
        vpsActive.value = false;
        errorMsg.value = `No AR coordinate is configured for ${officeName.value}. Choose Dean, Registrar, Cashier, or Guard House.`;
        return;
      }

      const { x, y, z } = destination.multiset;
      const mapPosition = new THREE.Vector3(-x, y, z).applyMatrix4(worldFromMap);
      destinationWorldPosition.copy(mapPosition);
      updateDestinationLabel(destination.label || officeName.value, destinationWorldPosition);
      pathwayWorldPoints.length = 0;
      AR_PATHWAY_POINTS.forEach((point) => {
        pathwayWorldPoints.push(
          new THREE.Vector3(-point.x, point.y, point.z).applyMatrix4(worldFromMap),
        );
      });
      hasDestinationWorldPosition = true;
      hasPathwayWorldPoints = pathwayWorldPoints.length > 1;
      destinationPathwayIndex = findNearestPathwayIndex(destinationWorldPosition);
      rebuildPathwaySegments(pathwayWorldPoints);
      navGroup.visible = false;
      updateNavigationPath();
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
  localizationFailed.value = false;
  hideNavigationPath();
}

async function retryLocalization() {
  if (!multisetAdapter?.isActive() || retryingLocalization.value) return;

  retryingLocalization.value = true;
  localizationFailed.value = false;
  errorMsg.value = "";
  hideNavigationPath();

  try {
    const result = await multisetAdapter.localizeFrame();
    if (!result) {
      localizationFailed.value = true;
    }
  } catch (err) {
    console.warn("Multiset localization retry failed:", err);
    vpsActive.value = false;
    localizationFailed.value = true;
    hideNavigationPath();
    errorMsg.value = describeArError(
      err,
      "VPS localization failed. Move slowly and try again in the mapped area.",
    );
  } finally {
    retryingLocalization.value = false;
  }
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
  hideNavigationPath();
  navGroup = null;
  pathGroup = null;
  userConnectorLine = null;
  destinationConnectorLine = null;
  destinationLabelSprite = null;
  hasDestinationWorldPosition = false;
  hasPathwayWorldPoints = false;
  destinationPathwayIndex = -1;
  pathwayWorldPoints.length = 0;
  routeWorldPoints.length = 0;
  arReady.value = false;
  started.value = false;
  xrActive.value = false;
  vpsActive.value = false;
  localizationFailed.value = false;
  retryingLocalization.value = false;
  lastSessionError = null;
}

onBeforeUnmount(cleanup);

onMounted(() => {
  // Office id from query param, used by future backend hookup
  if (!officeId.value) {
    errorMsg.value = "No destination specified.";
    return;
  }

  void prepareAr();
});
</script>
