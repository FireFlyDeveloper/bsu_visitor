<template>
  <Navbar />
  <div class="min-h-screen bg-slate-100 px-4 sm:px-6 lg:px-8">
    <div
      class="mx-auto max-w-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
    >
      <div class="mb-6 text-center">
        <p
          class="text-sm font-semibold uppercase tracking-[0.28em] text-red-800"
        >
          Visitor check-in
        </p>
        <h1 class="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          VISITOR REGISTRATION FORM
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Search for an existing visitor or register a new one, then choose an
          office and create a mobile access link.
        </p>
      </div>

      <VisitorSearch @select="selectVisitor" />

      <form @submit.prevent="onSubmit" class="space-y-6">
        <div
          v-if="selectedVisitor"
          class="rounded-3xl border border-red-200 bg-red-50 p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p
                class="text-sm font-semibold uppercase tracking-[0.24em] text-red-800"
              >
                Using existing visitor
              </p>
              <p class="mt-2 text-lg font-semibold text-slate-950">
                {{ selectedVisitor.fullname }}
              </p>
              <p class="mt-1 text-sm text-slate-600">
                {{ selectedVisitor.contact_number }}
              </p>
              <p class="mt-1 text-sm text-slate-600">
                {{ selectedVisitor.address }}
              </p>
            </div>
            <button
              type="button"
              @click="clearSelection"
              class="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Use new visitor
            </button>
          </div>
        </div>

        <div v-if="!selectedVisitor" class="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              for="fullname"
              class="block text-sm font-medium text-slate-700"
              >Full name</label
            >
            <input
              id="fullname"
              type="text"
              v-model="fullname"
              :required="!selectedVisitor"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
            />
          </div>

          <div>
            <label
              for="contact_number"
              class="block text-sm font-medium text-slate-700"
              >Contact number</label
            >
            <input
              id="contact_number"
              type="tel"
              v-model="contact_number"
              :required="!selectedVisitor"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
            />
          </div>
        </div>

        <div v-if="!selectedVisitor">
          <label for="address" class="block text-sm font-medium text-slate-700"
            >Address</label
          >
          <textarea
            id="address"
            v-model="address"
            rows="3"
            :required="!selectedVisitor"
            class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
          ></textarea>
        </div>

        <!-- ID TYPE + PHOTO (HIDDEN WHEN VISITOR SELECTED) -->
        <div v-if="!selectedVisitor" class="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              for="id_type"
              class="block text-sm font-medium text-slate-700"
            >
              ID type
            </label>

            <select
              id="id_type"
              v-model="id_type"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
            >
              <option value="">Select ID type</option>
              <option v-for="option in idTypes" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>

          <div>
            <label for="photo" class="block text-sm font-medium text-slate-700">
              Visitor photo
            </label>

            <input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              @change="handleFileChange"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition file:cursor-pointer file:border-0 file:bg-red-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
            />

            <p class="mt-2 text-sm text-slate-500">
              Upload a photo or take one with your camera.
            </p>

            <div v-if="imgData" class="mt-4">
              <p class="text-sm font-medium text-slate-700">Preview</p>
              <img
                :src="imgData"
                alt="Visitor photo preview"
                class="mt-2 h-48 w-full rounded-3xl object-cover border border-slate-200"
              />
            </div>
          </div>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              for="office_id"
              class="block text-sm font-medium text-slate-700"
              >Office</label
            >
            <select
              id="office_id"
              v-model="office_id"
              required
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
            >
              <option value="">Select office</option>
              <option
                v-for="office in offices"
                :key="office.id"
                :value="office.id"
              >
                {{ office.office_name }}
              </option>
            </select>
          </div>

          <div>
            <label
              for="purpose"
              class="block text-sm font-medium text-slate-700"
              >Purpose</label
            >
            <input
              id="purpose"
              type="text"
              v-model="purpose"
              placeholder="e.g. meeting, delivery, inquiry"
              class="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
            />
          </div>
        </div>

        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <button
            type="submit"
            :disabled="loading"
            class="inline-flex items-center justify-center rounded-3xl bg-red-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="loading">Processing...</span>
            <span v-else>Create access log</span>
          </button>
        </div>
      </form>

      <div
        v-if="error"
        class="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <VisitorCreateModal
        :show="showSuccessModal"
        :message="success"
        :shareLink="shareLink"
        @close="showSuccessModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import Navbar from "../../components/Navbar.vue";
import { ref, onMounted } from "vue";

import { useVisitorStore } from "../../store/visitor";
import { useOfficeStore } from "../../store/office";

import { useVisitorLogStore } from "../../store/visitorLog";
import VisitorCreateModal from "../../components/VisitorCreateModal.vue";
import VisitorSearch from "../../components/VisitorSearch.vue";

const officeStore = useOfficeStore();
const visitorStore = useVisitorStore();
const visitorLogStore = useVisitorLogStore();

const showSuccessModal = ref(false);

const searchTerm = ref("");
const searchLoading = ref(false);
const searchAttempted = ref(false);
const searchResults = ref([]);
const selectedVisitor = ref(null);
const offices = ref([]);
const fullname = ref("");
const contact_number = ref("");
const address = ref("");
const id_type = ref("");
const file = ref(null);
const imgData = ref("");
const office_id = ref("");
const purpose = ref("");
const loading = ref(false);
const error = ref("");
const success = ref("");
const shareLink = ref("");

const idTypes = [
  "Driver License",
  "Passport",
  "Student ID",
  "Employee ID",
  "Other",
];

const resetForm = () => {
  fullname.value = "";
  contact_number.value = "";
  address.value = "";
  id_type.value = "";
  imgData.value = "";
  office_id.value = "";
  purpose.value = "";
  selectedVisitor.value = null;
  shareLink.value = "";
};

const handleFileChange = (event) => {
  const selected = event.target.files?.[0];
  if (!selected) return;

  if (selected.size > 5 * 1024 * 1024) {
    alert("File too large! Max 5MB only.");
    return;
  }

  file.value = selected;

  imgData.value = URL.createObjectURL(selected);
};

const fetchOffices = async () => {
  try {
    await officeStore.fetchOffices();
    offices.value = officeStore.offices;
  } catch (err) {
    error.value = err?.message || "Unable to load office list.";
  }
};

const handleSearch = async () => {
  if (!searchTerm.value) return;
  searchLoading.value = true;
  searchAttempted.value = true;
  searchResults.value = [];
  selectedVisitor.value = null;
  error.value = "";

  try {
    const results = await visitorStore.fetchVisitors({
      fullname: searchTerm.value,
      contact_number: searchTerm.value,
    });
    searchResults.value = results;
  } catch (err) {
    error.value = err?.message || "Search failed. Please try again.";
  } finally {
    searchLoading.value = false;
  }
};

const selectVisitor = (visitor) => {
  selectedVisitor.value = visitor;
  searchResults.value = [];
  searchTerm.value = "";
  success.value = "";
  error.value = "";
};

const clearSelection = () => {
  selectedVisitor.value = null;
};

const onSubmit = async () => {
  loading.value = true;
  error.value = "";
  success.value = "";
  shareLink.value = "";

  try {
    const formData = new FormData();

    if (selectedVisitor.value) {
      formData.append("visitor_id", selectedVisitor.value.id);
    } else {
      if (!fullname.value || !contact_number.value || !address.value) {
        error.value = "fullname, contact number, and address are required.";
        return;
      }

      formData.append("fullname", fullname.value);
      formData.append("contact_number", contact_number.value);
      formData.append("address", address.value);
      formData.append("id_type", id_type.value || "");

      if (file.value) {
        formData.append("img", file.value);
      }
    }

    formData.append("office_id", office_id.value);
    formData.append("purpose", purpose.value || "");

    const res = await visitorLogStore.registerVisit(formData);

    const data = res?.data || res;

    success.value = "Visitor registered successfully!";
    shareLink.value = data.link;

    showSuccessModal.value = true;

    resetForm();
  } catch (err) {
    error.value = err?.message || "Failed to register visitor.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOffices);
</script>
