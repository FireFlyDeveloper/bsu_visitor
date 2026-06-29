<template>
  <Navbar />
  <div class="min-h-screen bg-slate-100 px-4 sm:px-6 lg:px-8 md:pl-64">
    <div
      class="mx-auto max-w-4xl border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
    >
      <div class="mb-6 text-center">
        <p
          class="text-sm font-semibold uppercase tracking-[0.28em] text-red-600"
        >
          Visitor destination
        </p>
        <h1 class="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Scan the QR code to see the destination
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Allow camera and location access to view the AR destination marker.
        </p>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600"
      >
        Loading destination…
      </div>

      <div
        v-else-if="error"
        class="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p class="text-sm font-semibold text-slate-700">Visitor</p>
            <p class="mt-3 text-lg font-semibold text-slate-900">
              {{ visitor.fullname }}
            </p>
            <p class="mt-1 text-sm text-slate-600">
              {{ visitor.contact_number }}
            </p>
            <p class="mt-1 text-sm text-slate-600">{{ visitor.address }}</p>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p class="text-sm font-semibold text-slate-700">Destination</p>
            <p class="mt-3 text-lg font-semibold text-slate-900">
              {{ office.office_name }}
            </p>
            <p class="mt-1 text-sm text-slate-600">
              Type: {{ office.type || "Unknown" }}
            </p>
            <div class="mt-4 text-sm text-slate-600 space-y-1">
              <p><strong>Latitude:</strong> {{ office.latitude }}</p>
              <p><strong>Longitude:</strong> {{ office.longitude }}</p>
              <p><strong>Distance:</strong> {{ formatDistance }} away</p>
              <p><strong>Direction:</strong> {{ direction }}</p>
              <p><strong>Your Latitude:</strong> {{ currentLatitude }}</p>
              <p><strong>Your Longitude:</strong> {{ currentLongitude }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p class="text-sm font-semibold text-slate-700">
            AR destination marker
          </p>
          <p class="mt-2 text-sm text-slate-500">
            Point your camera toward the marker. The arrow points to your
            destination.
          </p>

          <div class="mt-4 flex flex-wrap gap-3">
            <button
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="
                !isWebcamSupported || cameraAllowed || cameraRequesting
              "
              @click="requestCamera"
            >
              {{
                cameraAllowed
                  ? "Camera Allowed"
                  : cameraRequesting
                    ? "Allowing Camera…"
                    : "Allow Camera"
              }}
            </button>

            <button
              class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              :disabled="gpsAllowed || gpsRequesting"
              @click="requestGps"
            >
              {{
                gpsAllowed
                  ? "GPS Allowed"
                  : gpsRequesting
                    ? "Allowing GPS…"
                    : "Allow GPS"
              }}
            </button>
          </div>

          <div class="mt-3 flex flex-wrap gap-2 text-sm">
            <span :class="cameraAllowed ? 'text-emerald-700' : 'text-amber-600'"
              >Camera: {{ cameraAllowed ? "Granted" : "Not Granted" }}</span
            >
            <span :class="gpsAllowed ? 'text-emerald-700' : 'text-amber-600'"
              >GPS: {{ gpsAllowed ? "Granted" : "Not Granted" }}</span
            >
            <span v-if="gpsAccuracy" class="text-slate-600"
              >Accuracy: ±{{ gpsAccuracy }}m</span
            >
          </div>

          <div
            v-if="permissionError"
            class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {{ permissionError }}
          </div>

          <div
            class="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-black"
          >
            <div v-if="!isWebcamSupported" class="p-6 text-sm text-slate-300">
              Your browser does not support camera/location access for the AR
              view. Use a mobile browser and allow camera access to see the red
              destination marker.
            </div>
            <div
              v-else-if="!cameraAllowed || !gpsAllowed"
              class="p-6 text-sm text-slate-300"
            >
              Please allow camera and GPS access using the buttons above to load
              the AR destination marker.
            </div>
            <div v-else class="relative h-105 w-full">
              <a-scene
                embedded
                vr-mode-ui="enabled: false"
                arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false;"
                renderer="antialias: true; alpha: true"
                style="width: 100%; height: 100%"
              >
                <a-camera
                  gps-new-camera="gpsMinDistance: 0; simulateLatitude: 0; simulateLongitude: 0; positionMinAccuracy: 10"
                  rotation-reader
                ></a-camera>

                <!-- Precise destination marker with multiple visual layers -->

                <!-- Main glowing sphere - visible from distance -->
                <a-entity
                  :gps-new-entity-place="gpsPlace"
                  position="0 0 0"
                  scale="15 15 15"
                  geometry="primitive: sphere; radius: 1"
                  material="color: #ff3333; opacity: 0.4; transparent: true; shader: flat; side: double"
                ></a-entity>

                <!-- Inner bright core -->
                <a-entity
                  :gps-new-entity-place="gpsPlace"
                  position="0 0 0"
                  scale="8 8 8"
                  geometry="primitive: sphere; radius: 1"
                  material="color: #ff0000; opacity: 0.7; transparent: true; emissive: #ff0000; emissiveIntensity: 0.5"
                ></a-entity>

                <!-- Direction arrow - points toward destination -->
                <a-entity
                  :gps-new-entity-place="gpsPlace"
                  position="0 5 0"
                  scale="10 10 10"
                >
                  <a-entity
                    geometry="primitive: cone; radiusBottom: 0.5; radiusTop: 0; height: 1.5"
                    material="color: #ff4444; emissive: #ff0000; emissiveIntensity: 0.3"
                    position="0 0.75 0"
                    animation="property: rotation; to: 0 360 0; dur: 4000; loop: true; easing: linear"
                  ></a-entity>
                  <a-entity
                    geometry="primitive: cylinder; radius: 0.15; height: 1"
                    material="color: #ff4444"
                    position="0 0 0"
                  ></a-entity>
                </a-entity>

                <!-- Ground ring for precise location -->
                <a-entity
                  :gps-new-entity-place="gpsPlace"
                  position="0 -2 0"
                  scale="12 12 12"
                  geometry="primitive: torus; radius: 1; radiusTubular: 0.03"
                  material="color: #ff6666; emissive: #ff0000; emissiveIntensity: 0.2"
                  rotation="90 0 0"
                  animation="property: scale; to: 13 13 13; dur: 1500; dir: alternate; loop: true; easing: easeInOutQuad"
                ></a-entity>

                <!-- Pulsing rings for better visibility -->
                <a-entity
                  :gps-new-entity-place="gpsPlace"
                  position="0 0 0"
                  scale="10 10 10"
                  geometry="primitive: ring; radiusInner: 0.9; radiusOuter: 1"
                  material="color: #ff0000; opacity: 0.6; transparent: true; side: double"
                  animation="property: scale; to: 18 18 18; dur: 2000; loop: true; easing: easeOutCubic"
                  animation__opacity="property: material.opacity; to: 0; dur: 2000; loop: true; easing: easeOutCubic"
                ></a-entity>

                <!-- Distance text -->
                <a-entity
                  :gps-new-entity-place="gpsPlace"
                  position="0 8 0"
                  look-at="[camera]"
                  scale="15 15 15"
                >
                  <a-text
                    :value="distanceText"
                    align="center"
                    color="#ffffff"
                    width="4"
                    anchor="center"
                    position="0 0 0"
                    scale="0.5 0.5 0.5"
                    background-color="#cc0000"
                    background-opacity="0.8"
                    padding="0.1"
                    wrap-count="20"
                  ></a-text>
                </a-entity>

                <!-- Vertical beacon beam -->
                <a-entity
                  :gps-new-entity-place="gpsPlace"
                  position="0 20 0"
                  scale="3 20 3"
                  geometry="primitive: cylinder; radius: 0.5; height: 2"
                  material="color: #ff0000; opacity: 0.15; transparent: true"
                  animation="property: material.opacity; to: 0.3; dur: 1500; dir: alternate; loop: true"
                ></a-entity>

                <!-- Floating particles for enhanced visibility -->
                <a-entity
                  v-for="i in 8"
                  :key="i"
                  :gps-new-entity-place="gpsPlace"
                  :position="`${Math.sin((i * Math.PI) / 4) * 4} ${i * 1.5} ${Math.cos((i * Math.PI) / 4) * 4}`"
                  scale="3 3 3"
                >
                  <a-sphere
                    radius="0.1"
                    color="#ff4444"
                    opacity="0.8"
                    animation="property: position; to: 0 0 0; dur: 2000; loop: true; dir: alternate; easing: easeInOutQuad"
                  ></a-sphere>
                </a-entity>
              </a-scene>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from "../../components/Navbar.vue";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const visitor = ref(null);
const office = ref(null);
const loading = ref(true);
const error = ref("");

const isWebcamSupported = ref(false);
onMounted(() => {
  isWebcamSupported.value = !!navigator?.mediaDevices?.getUserMedia;
});

const cameraAllowed = ref(false);
const gpsAllowed = ref(false);
const cameraRequesting = ref(false);
const gpsRequesting = ref(false);
const permissionError = ref("");
const currentPosition = ref(null);
const gpsAccuracy = ref(null);
const distance = ref(0);
const bearing = ref(0);

const gpsPlace = computed(() => {
  if (!office.value) return "";
  return `latitude: ${office.value.latitude}; longitude: ${office.value.longitude}`;
});

const formatDistance = computed(() => {
  if (!distance.value) return "Calculating...";
  if (distance.value < 1) {
    return `${Math.round(distance.value * 1000)} meters`;
  }
  return `${distance.value.toFixed(2)} km`;
});

const direction = computed(() => {
  if (!bearing.value) return "Calculating...";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing.value / 45) % 8;
  return `${bearing.value.toFixed(0)}° (${directions[index]})`;
});

const distanceText = computed(() => {
  if (!distance.value) return "Calculating...";
  if (distance.value < 0.1) {
    return "You've arrived!";
  }
  return `${formatDistance.value}\n${direction.value}`;
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

let watchId = null;

const updatePosition = (position) => {
  currentPosition.value = position;
  gpsAccuracy.value = Math.round(position.coords.accuracy);

  if (office.value) {
    distance.value = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      office.value.latitude,
      office.value.longitude,
    );

    bearing.value = calculateBearing(
      position.coords.latitude,
      position.coords.longitude,
      office.value.latitude,
      office.value.longitude,
    );
  }

  gpsAllowed.value = true;
};

const currentLatitude = computed(() =>
  currentPosition.value ? currentPosition.value.coords.latitude : null,
);

const currentLongitude = computed(() =>
  currentPosition.value ? currentPosition.value.coords.longitude : null,
);

const requestCamera = async () => {
  cameraRequesting.value = true;
  permissionError.value = "";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    stream.getTracks().forEach((track) => track.stop());
    cameraAllowed.value = true;
  } catch (err) {
    permissionError.value = "Camera access denied or not available.";
  } finally {
    cameraRequesting.value = false;
  }
};

const requestGps = () => {
  gpsRequesting.value = true;
  permissionError.value = "";
  if (!navigator.geolocation) {
    permissionError.value = "Geolocation is not supported by this browser.";
    gpsRequesting.value = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      updatePosition(position);
      gpsRequesting.value = false;

      // Start watching position for updates
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        (err) => {
          permissionError.value = "Error tracking location: " + err.message;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    },
    (err) => {
      permissionError.value = "Location access denied or not available.";
      gpsRequesting.value = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
};

const loadVisitorAccess = async () => {
  const token = route.params.token;
  if (!token) {
    error.value = "No visitor token provided.";
    loading.value = false;
    return;
  }

  try {
    const apiBase =
      import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
    const response = await fetch(
      `${apiBase}/visitor-links/${encodeURIComponent(token)}`,
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || response.statusText);
    }

    visitor.value = data.visitor;
    office.value = data.office;
  } catch (err) {
    error.value = err?.message || "Unable to load destination details.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadVisitorAccess);

onUnmounted(() => {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
});
</script>

<style scoped>
.a-scene-container canvas,
.a-scene canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
