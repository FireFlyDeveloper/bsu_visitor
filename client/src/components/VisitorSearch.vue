<template>
  <div class="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
    <label class="block text-sm font-medium text-slate-700">
      Search existing visitor
    </label>

    <div class="mt-3 flex flex-col gap-3 sm:flex-row">
      <input
        type="search"
        v-model="searchTerm"
        placeholder="Search by name or contact"
        class="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
      />

      <button
        @click="handleSearch"
        :disabled="loading || !searchTerm"
        class="inline-flex justify-center rounded-3xl bg-red-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        <span v-if="loading">Searching...</span>
        <span v-else>Search</span>
      </button>
    </div>

    <p class="mt-3 text-sm text-slate-500">
      If the visitor already exists, select them here.
    </p>

    <!-- RESULTS -->
    <div v-if="results.length" class="mt-6 space-y-3">
      <p class="text-sm font-semibold text-slate-700">Matching visitors</p>

      <div class="grid gap-3">
        <button
          v-for="visitor in results"
          :key="visitor.id"
          @click="$emit('select', visitor)"
          class="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm hover:border-red-800"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-slate-900">
                {{ visitor.fullname }}
              </p>
              <p class="text-sm text-slate-500">
                {{ visitor.contact_number }}
              </p>
            </div>

            <span
              class="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800"
            >
              Select
            </span>
          </div>
        </button>
      </div>
    </div>

    <div
      v-else-if="searched && !loading"
      class="mt-6 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
    >
      No visitor found.
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useVisitorStore } from "../store/visitor";

const visitorStore = useVisitorStore();

const searchTerm = ref("");
const results = ref([]);
const loading = ref(false);
const searched = ref(false);

const handleSearch = async () => {
  loading.value = true;
  searched.value = true;
  results.value = [];

  try {
    const data = await visitorStore.fetchVisitors({
      fullname: searchTerm.value,
      contact_number: searchTerm.value,
    });

    results.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>
