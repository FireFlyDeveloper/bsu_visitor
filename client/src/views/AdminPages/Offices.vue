<script setup>
import { onMounted, ref } from "vue";
import { useOfficeStore } from "@/store/office.js";

const officeStore = useOfficeStore();

const showModal = ref(false);
const selectedOffice = ref(null);
const saving = ref(false);

onMounted(() => {
  officeStore.fetchOffices();
});

const openOffice = (office) => {
  selectedOffice.value = {
    ...office,
    name: office.office_name,
  };
  showModal.value = true;
};

// Save updates
const saveOffice = async () => {
  if (!selectedOffice.value.name) {
    alert("Office name is required");
    return;
  }

  saving.value = true;

  const payload = {
    office_name: selectedOffice.value.name,
    latitude: selectedOffice.value.latitude,
    longitude: selectedOffice.value.longitude,
    type: selectedOffice.value.type,
    status: selectedOffice.value.status,
  };

  try {
    await officeStore.updateOffice(selectedOffice.value.id, payload);
    showModal.value = false;
  } catch (err) {
    alert(err.message || "Failed to update office");
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  selectedOffice.value = null;
};

// Get status color and icon
const getStatusConfig = (status) => {
  switch (status) {
    case "available":
      return {
        color: "green",
        bg: "bg-green-50",
        text: "text-green-700",
        icon: "M5 13l4 4L19 7",
      };
    case "busy":
      return {
        color: "yellow",
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      };
    case "not available":
      return {
        color: "red",
        bg: "bg-red-50",
        text: "text-red-700",
        icon: "M6 18L18 6M6 6l12 12",
      };
    default:
      return {
        color: "gray",
        bg: "bg-gray-50",
        text: "text-gray-700",
        icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      };
  }
};
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
            Offices
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage all office locations and their status
          </p>
        </div>
        <!-- Refresh Button -->
        <button
          @click="officeStore.fetchOffices()"
          :disabled="officeStore.fetchingOffices"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': officeStore.fetchingOffices }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="officeStore.error"
      class="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ officeStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div
      v-if="officeStore.successMessage"
      class="mb-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-green-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-700">{{ officeStore.successMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="officeStore.fetchingOffices"
      class="flex items-center justify-center py-16"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          class="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin"
        ></div>
        <span class="text-sm text-slate-500">Loading offices...</span>
      </div>
    </div>

    <!-- Offices Grid -->
    <div
      v-else-if="officeStore.offices.length === 0"
      class="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center"
    >
      <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4"
      >
        <svg
          class="w-8 h-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <p class="text-slate-500 font-medium">No offices found</p>
      <p class="text-sm text-slate-400 mt-1">
        Offices will appear here once added
      </p>
    </div>

    <!-- Offices Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="office in officeStore.offices"
        :key="office.id"
        @click="openOffice(office)"
        class="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      >
        <!-- Header with Status -->
        <div class="relative p-4 pb-3 border-b border-slate-100">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h2 class="text-lg font-semibold text-slate-800 truncate pr-2">
                {{ office.office_name }}
              </h2>
            </div>
            <div
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              :class="getStatusConfig(office.status).bg"
            >
              <svg
                class="w-3 h-3"
                :class="getStatusConfig(office.status).text"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="getStatusConfig(office.status).icon"
                />
              </svg>
              <span :class="getStatusConfig(office.status).text">
                {{ office.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 space-y-3">

          <!-- Type -->
          <div class="flex items-center gap-2 text-sm">
            <svg
              class="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M3 10h18M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z"
              />
            </svg>
            <span class="text-slate-600">Type:</span>
            <span class="font-medium text-slate-700">{{
              office.type || "Standard"
            }}</span>
          </div>

          <!-- Coordinates -->
          <div class="flex items-start gap-2 text-sm">
            <svg
              class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div class="text-slate-600">
              <span class="block text-xs text-slate-400">Coordinates</span>
              <span class="text-sm"
                >{{ office.latitude || "N/A" }},
                {{ office.longitude || "N/A" }}</span
              >
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>Click to edit</span>
            <svg
              class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        ></div>

        <!-- Modal Panel -->
        <div
          class="relative bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-slate-800">Edit Office</h2>
              <button
                @click="closeModal"
                class="text-slate-400 hover:text-slate-500 transition-colors"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div v-if="selectedOffice" class="space-y-4">
              <!-- Office Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Office Name</label
                >
                <input
                  v-model="selectedOffice.name"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter office name"
                />
              </div>

              <!-- Latitude -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Latitude</label
                >
                <input
                  v-model="selectedOffice.latitude"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter latitude"
                />
              </div>

              <!-- Longitude -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Longitude</label
                >
                <input
                  v-model="selectedOffice.longitude"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter longitude"
                />
              </div>

              <!-- Type -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Type</label
                >
                <input
                  v-model="selectedOffice.type"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter office type"
                />
              </div>

              <!-- Status -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Status</label
                >
                <select
                  v-model="selectedOffice.status"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="not available">Not Available</option>
                </select>
              </div>

              <!-- Queue (Read Only) -->
              
            </div>

            <div class="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                @click="closeModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                @click="saveOffice"
                :disabled="saving"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? "Saving..." : "Save Changes" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
