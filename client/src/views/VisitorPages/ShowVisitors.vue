<template>
  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
            Visitors
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage all registered visitors
          </p>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="visitorStore.error"
      class="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4"
    >
      <div class="flex items-center">
        <div class="shrink-0">
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
          <p class="text-sm text-red-700">{{ visitorStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="visitorStore.loading"
      class="flex items-center justify-center py-16"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          class="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin"
        ></div>
        <span class="text-sm text-slate-500">Loading visitors...</span>
      </div>
    </div>

    <!-- Visitors Grid -->
    <div
      v-else-if="visitorStore.visitors.length === 0"
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <p class="text-slate-500 font-medium">No visitors found</p>
      <p class="text-sm text-slate-400 mt-1">
        Click "Add Visitor" to get started
      </p>
    </div>

    <!-- Cards Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <div
        v-for="visitor in visitorStore.visitors"
        :key="visitor.id"
        class="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      >
        <!-- Image -->
        <div
          class="relative h-48 overflow-hidden bg-linear-to-br from-red-50 to-slate-100"
        >
          <img
            :src="getImageUrl(visitor.img)"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            @error="handleImageError"
          />
          <!-- Status Badge (if any) -->
          <div class="absolute top-2 right-2">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm"
            >
              ID: {{ visitor.id_type || "Standard" }}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4">
          <h2 class="text-lg font-semibold text-slate-800 truncate">
            {{ visitor.fullname }}
          </h2>

          <div class="mt-2 space-y-1.5">
            <p class="text-sm text-slate-600 flex items-center gap-2">
              <svg
                class="w-4 h-4 text-slate-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span class="truncate">{{ visitor.contact_number }}</span>
            </p>

            <p class="text-sm text-slate-600 flex items-center gap-2">
              <svg
                class="w-4 h-4 text-slate-400 shrink-0"
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
              <span class="truncate">{{
                visitor.address || "No address"
              }}</span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              @click="openEdit(visitor)"
              class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>

            <button
              @click="openDelete(visitor)"
              class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="visitorStore.visitors.length > 0"
      class="mt-8 flex items-center justify-between"
    >
      <div class="text-sm text-slate-500">
        Page
        <span class="font-medium text-slate-700">{{
          visitorStore.page || 1
        }}</span>
      </div>

      <div class="flex gap-2">
        <button
          @click="prevPage"
          :disabled="visitorStore.page <= 1 || visitorStore.loading"
          class="relative inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        <button
          @click="nextPage"
          :disabled="visitorStore.loading"
          class="relative inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          Next
          <svg
            class="w-4 h-4"
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
        </button>
      </div>
    </div>

    <!-- ADD/EDIT MODAL -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeEditModal"
      >
        <div
          class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        ></div>

        <div
          class="relative bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-slate-800">
                {{ isAdding ? "Add Visitor" : "Edit Visitor" }}
              </h2>
              <button
                @click="closeEditModal"
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

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Full Name</label
                >
                <input
                  v-model="selected.fullname"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Contact Number</label
                >
                <input
                  v-model="selected.contact_number"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter contact number"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Address</label
                >
                <input
                  v-model="selected.address"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >ID Type</label
                >
                <input
                  v-model="selected.id_type"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="e.g., Passport, Driver's License"
                />
              </div>

              <div v-if="isAdding">
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Profile Image</label
                >
                <input
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                  class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>
            </div>

            <div class="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                @click="closeEditModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                @click="saveVisitor"
                :disabled="saving"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{
                  saving
                    ? "Saving..."
                    : isAdding
                      ? "Add Visitor"
                      : "Save Changes"
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- DELETE MODAL -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeDeleteModal"
      >
        <div
          class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        ></div>

        <div
          class="relative bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-red-600">Delete Visitor</h2>
              <button
                @click="closeDeleteModal"
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

            <div class="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
              <div
                class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <p class="font-medium text-slate-800">
                  {{ selected.fullname }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ selected.contact_number }}
                </p>
              </div>
            </div>

            <p class="text-slate-600 mt-4">
              Are you sure you want to delete this visitor? This action cannot
              be undone.
            </p>

            <div class="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                @click="closeDeleteModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                @click="deleteVisitor"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useVisitorStore } from "@/store/visitor.js";

const visitorStore = useVisitorStore();

const API_BASE = import.meta.env.VITE_API_BASE;
const IMAGE_BASE = API_BASE.replace("/api", "");

// Modal states
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const isAdding = ref(false);
const saving = ref(false);
const selectedImage = ref(null);

// Selected visitor
const selected = ref({
  id: null,
  fullname: "",
  contact_number: "",
  address: "",
  id_type: "",
  img: "",
});

function getImageUrl(path) {
  if (!path) return "https://via.placeholder.com/300x200?text=No+Image";
  return `${IMAGE_BASE}/${path.replace(/^\//, "")}`;
}

function handleImageError(e) {
  e.target.src = "https://via.placeholder.com/300x200?text=Image+Error";
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    selectedImage.value = file;
  }
}

// Pagination
const nextPage = async () => {
  if (visitorStore.loading) return;
  visitorStore.page = (visitorStore.page || 1) + 1;
  await visitorStore.fetchVisitors();
};

const prevPage = async () => {
  if (visitorStore.loading || (visitorStore.page || 1) <= 1) return;
  visitorStore.page = (visitorStore.page || 1) - 1;
  await visitorStore.fetchVisitors();
};

// Open Add Modal
function openAddModal() {
  isAdding.value = true;
  selected.value = {
    id: null,
    fullname: "",
    contact_number: "",
    address: "",
    id_type: "",
    img: "",
  };
  selectedImage.value = null;
  showEditModal.value = true;
}

// Open Edit
function openEdit(visitor) {
  isAdding.value = false;
  selected.value = { ...visitor };
  selectedImage.value = null;
  showEditModal.value = true;
}

// Close Edit Modal
function closeEditModal() {
  showEditModal.value = false;
  selected.value = {
    id: null,
    fullname: "",
    contact_number: "",
    address: "",
    id_type: "",
    img: "",
  };
  selectedImage.value = null;
}

// Save Visitor (Add or Update)
async function saveVisitor() {
  if (!selected.value.fullname || !selected.value.contact_number) {
    alert("Please fill in required fields");
    return;
  }

  saving.value = true;

  try {
    if (isAdding.value) {
      // For adding new visitor with image upload
      if (selectedImage.value) {
        const formData = new FormData();
        formData.append("fullname", selected.value.fullname);
        formData.append("contact_number", selected.value.contact_number);
        formData.append("address", selected.value.address);
        formData.append("id_type", selected.value.id_type);
        formData.append("img", selectedImage.value);

        await visitorStore.addVisitorWithImage(formData);
      } else {
        await visitorStore.addVisitor(selected.value);
      }
    } else {
      await visitorStore.updateVisitor(selected.value.id, selected.value);
    }

    await visitorStore.fetchVisitors();
    closeEditModal();
  } catch (err) {
    alert(err.message || "Failed to save visitor");
  } finally {
    saving.value = false;
  }
}

// Open Delete
function openDelete(visitor) {
  selected.value = visitor;
  showDeleteModal.value = true;
}

// Close Delete Modal
function closeDeleteModal() {
  showDeleteModal.value = false;
  selected.value = {
    id: null,
    fullname: "",
    contact_number: "",
    address: "",
    id_type: "",
    img: "",
  };
}

// Delete Visitor
async function deleteVisitor() {
  try {
    await visitorStore.deleteVisitor(selected.value.id);
    await visitorStore.fetchVisitors();
    closeDeleteModal();
  } catch (err) {
    alert(err.message || "Failed to delete visitor");
  }
}

onMounted(() => {
  visitorStore.fetchVisitors();
});
</script>
