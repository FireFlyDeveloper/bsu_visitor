<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import { useVisitorLinkStore } from "@/store/visitorLinks";
import Navbar from "../../components/Navbar.vue";

const visitorLinkStore = useVisitorLinkStore();
const currentIndex = ref(0);
const autoRefreshEnabled = ref(true);

// 🔥 always correct environment (local or ngrok)
const BASE_URL = window.location.origin;

// Polling interval reference
let pollingInterval = null;

// Get recent links first (newest first)
const sortedLinks = computed(() => {
  // Assuming links have created_at or id - adjust based on your data structure
  return [...visitorLinkStore.links].sort((a, b) => {
    // If you have created_at field
    if (a.created_at && b.created_at) {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    // Fallback to id (assuming higher id = newer)
    return (b.id || 0) - (a.id || 0);
  });
});

const currentLink = computed(() => {
  if (sortedLinks.value.length === 0) return null;
  return sortedLinks.value[currentIndex.value];
});

const generateAccessUrl = (token) => {
  return `${BASE_URL}/visitor-access/${token}`;
};

const generateQR = (token) => {
  const url = encodeURIComponent(generateAccessUrl(token));
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
};

// Navigation methods
const next = () => {
  if (sortedLinks.value.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % sortedLinks.value.length;
  }
};

const prev = () => {
  if (sortedLinks.value.length > 0) {
    currentIndex.value =
      currentIndex.value === 0
        ? sortedLinks.value.length - 1
        : currentIndex.value - 1;
  }
};

const goToIndex = (index) => {
  currentIndex.value = index;
};

// Fetch data with option to preserve current index
const fetchAndUpdate = async (preserveIndex = true) => {
  const currentId = currentLink.value?.id;
  await visitorLinkStore.fetchVisitorLinks();

  if (preserveIndex && currentId) {
    // Try to find the same visitor in the new data
    const newIndex = sortedLinks.value.findIndex(
      (link) => link.id === currentId,
    );
    if (newIndex !== -1) {
      currentIndex.value = newIndex;
    } else if (sortedLinks.value.length > 0) {
      // If current visitor is gone, go to first item
      currentIndex.value = 0;
    }
  } else if (
    sortedLinks.value.length > 0 &&
    currentIndex.value >= sortedLinks.value.length
  ) {
    // Adjust index if it's out of bounds
    currentIndex.value = 0;
  }
};

// Auto-refresh to detect new visitor_log entries
const startAutoRefresh = () => {
  if (pollingInterval) clearInterval(pollingInterval);

  // Poll every 5 seconds (adjust as needed)
  pollingInterval = setInterval(async () => {
    await fetchAndUpdate(true);
  }, 5000);
};

const stopAutoRefresh = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value;
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

// Manual refresh button handler
const manualRefresh = async () => {
  await fetchAndUpdate(false); // Reset to first item on manual refresh
};

// Check for new data periodically even when auto-refresh is off
// You can also use WebSocket for real-time updates
const checkForUpdates = async () => {
  const oldLength = sortedLinks.value.length;
  await fetchAndUpdate(true);
  const newLength = sortedLinks.value.length;

  if (newLength > oldLength) {
    // New visitor added! Show notification (optional)
    console.log(`New visitor added! Total: ${newLength}`);
    // You could add a toast notification here
  }
};

onMounted(() => {
  fetchAndUpdate(false);
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <Navbar />

  <div class="container mx-auto px-4 py-6">
    <!-- Controls Bar with Red Accent -->
    <div
      class="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white rounded-lg shadow-lg border-l-8 border-red-800 p-4"
    >
      <div class="flex gap-2 mb-3 sm:mb-0">
        <button
          @click="manualRefresh"
          class="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition shadow-md flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
        <button
          @click="toggleAutoRefresh"
          :class="[
            'px-4 py-2 rounded-lg transition shadow-md flex items-center gap-2',
            autoRefreshEnabled
              ? 'bg-green-700 text-white hover:bg-green-800'
              : 'bg-gray-500 text-white hover:bg-gray-600',
          ]"
        >
          <span>{{ autoRefreshEnabled ? "⏸️" : "▶️" }}</span>
          {{ autoRefreshEnabled ? "Auto-refresh ON" : "Auto-refresh OFF" }}
        </button>
      </div>
    </div>

    <!-- No data state -->
    <div
      v-if="sortedLinks.length === 0"
      class="text-center py-12 bg-gray-50 rounded-xl border border-gray-200"
    >
      <div class="text-6xl mb-4">📋</div>
      <p class="text-gray-500 text-lg">No visitor links available</p>
      <p class="text-gray-400 text-sm mt-2">New visitors will appear here</p>
    </div>

    <!-- Carousel -->
    <div
      v-else
      class="relative bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-xl border border-red-100 p-6 md:p-8"
    >
      <!-- Main QR Display -->
      <div class="flex flex-col items-center justify-center">
        <div
          class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border-2 border-red-200 relative"
        >
          <!-- Red accent ribbon -->
          <div
            class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-800 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md"
          >
            WELCOME TO BSU
          </div>
          <img
            :src="generateQR(currentLink.token)"
            class="w-80 h-80 md:w-[450px] md:h-[450px] object-contain"
            alt="QR Code"
          />
        </div>

        <!-- Visitor Info Card -->
        <div
          class="text-center mb-6 bg-white rounded-xl shadow-md p-6 w-full max-w-md border-t-4 border-red-800"
        >
          <h2
            class="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2"
          >
            <span class="text-red-800">👤</span>
            {{ currentLink.visitor.fullname }}
          </h2>
          <div class="mt-3 space-y-2">
            <p class="text-gray-600 flex items-center justify-center gap-2">
              <span class="text-red-800">📞</span>
              {{ currentLink.visitor.contact_number }}
            </p>
            <p class="text-gray-600 flex items-center justify-center gap-2">
              <span class="text-red-800">🏢</span>
              {{ currentLink.office.office_name }}
            </p>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-100">
            <p
              class="text-xs text-red-700 break-all max-w-md mx-auto bg-red-50 p-2 rounded-lg font-mono"
            >
              🔗 {{ generateAccessUrl(currentLink.token) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation Arrows with Red Theme -->
      <button
        @click="prev"
        class="absolute left-2 md:left-0 top-1/2 transform -translate-y-1/2 bg-red-800 hover:bg-red-900 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Previous"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        @click="next"
        class="absolute right-2 md:right-0 top-1/2 transform -translate-y-1/2 bg-red-800 hover:bg-red-900 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Next"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <!-- Name Navigation (Small navigation) with Red Selection -->
      <div class="mt-6">
        <div
          class="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-red-100"
        >
          <button
            v-for="(link, idx) in sortedLinks"
            :key="link.token"
            @click="goToIndex(idx)"
            :class="[
              'px-3 py-1.5 rounded-full text-sm transition-all duration-200 font-medium shadow-sm',
              currentIndex === idx
                ? 'bg-red-800 text-white shadow-md ring-2 ring-red-300'
                : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-800',
            ]"
          >
            {{ link.visitor.fullname }}
          </button>
        </div>
      </div>

      <!-- Indicator dots with Red Accent -->
      <div class="flex justify-center gap-2 mt-5">
        <button
          v-for="(_, idx) in sortedLinks"
          :key="idx"
          @click="goToIndex(idx)"
          :class="[
            'h-2 rounded-full cursor-pointer transition-all duration-200',
            currentIndex === idx
              ? 'bg-red-800 w-6'
              : 'bg-gray-300 w-2 hover:bg-red-300',
          ]"
        ></button>
      </div>

      <!-- Visitor counter indicator -->
      <div class="text-center mt-4 text-sm text-gray-500">
        Visitor {{ currentIndex + 1 }} of {{ sortedLinks.length }}
      </div>
    </div>
  </div>
</template>
