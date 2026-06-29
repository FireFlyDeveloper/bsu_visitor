<template>
  <div class="p-6 bg-linear-to-br from-gray-50 to-gray-100 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="mb-8 text-center md:text-left">
        <h1 class="text-3xl font-bold text-gray-800 tracking-tight">
          Office Status Dashboard
        </h1>
        <p class="text-gray-600 mt-1">
          Manage and monitor office availability in real-time
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="officeStore.fetchingOffices"
        class="flex justify-center items-center py-12"
      >
        <div class="animate-pulse flex flex-col items-center">
          <div
            class="w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"
          ></div>
          <p class="mt-4 text-gray-700 font-medium">Loading offices...</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-if="officeStore.error"
        class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm"
      >
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-red-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-red-800 font-medium">{{ officeStore.error }}</span>
        </div>
      </div>

      <!-- Offices Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        v-if="!officeStore.fetchingOffices"
      >
        <div
          v-for="office in officeStore.offices"
          :key="office.id"
          class="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200"
        >
          <!-- Office Card Content -->
          <div class="p-5">
            <!-- Office Header -->
            <div class="flex justify-between items-start mb-3">
              <h2
                class="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors"
              >
                {{ office.office_name }}
              </h2>
              <!-- Queue Badge -->
              <div
                class="bg-gray-100 rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-700"
              >
                Queue: {{ office.queue_count }}
              </div>
            </div>

            <!-- Status Badge -->
            <div class="mb-4">
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :class="{
                  'bg-emerald-100 text-emerald-800':
                    office.status === 'available',
                  'bg-amber-100 text-amber-800': office.status === 'busy',
                  'bg-rose-100 text-rose-800':
                    office.status === 'not available',
                }"
              >
                <span
                  class="w-2 h-2 rounded-full mr-2"
                  :class="{
                    'bg-emerald-500': office.status === 'available',
                    'bg-amber-500': office.status === 'busy',
                    'bg-rose-500': office.status === 'not available',
                  }"
                ></span>
                {{ office.status }}
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 flex gap-2">
              <button
                class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                :class="{
                  'opacity-50 cursor-not-allowed':
                    office.status === 'available',
                }"
                @click="changeStatus(office, 'available')"
                :disabled="office.status === 'available'"
              >
                Available
              </button>

              <button
                class="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                :class="{
                  'opacity-50 cursor-not-allowed': office.status === 'busy',
                }"
                @click="changeStatus(office, 'busy')"
                :disabled="office.status === 'busy'"
              >
                Busy
              </button>

              <button
                class="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                :class="{
                  'opacity-50 cursor-not-allowed':
                    office.status === 'not available',
                }"
                @click="changeStatus(office, 'not available')"
                :disabled="office.status === 'not available'"
              >
                Not avail.
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Message Toast -->
      <div
        v-if="officeStore.successMessage"
        class="fixed bottom-6 right-6 bg-gray-800 text-white px-5 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-bottom-5 duration-300 z-50"
      >
        <svg
          class="w-5 h-5 text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span class="text-gray-100">{{ officeStore.successMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { useOfficeStore } from "@/store/office.js";

const officeStore = useOfficeStore();

onMounted(() => {
  officeStore.fetchOffices();
});

watch(
  () => officeStore.successMessage,
  (newVal) => {
    if (newVal) {
      setTimeout(() => {
        officeStore.successMessage = null;
      }, 2000);
    }
  },
);

const changeStatus = async (office, status) => {
  try {
    officeStore.office = office;
    await officeStore.updateOfficeStatusBySecurity(status);
  } catch (err) {
    console.error(err);
  }
};
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-in {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
