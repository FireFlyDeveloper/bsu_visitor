<script setup>
import { onMounted, ref } from "vue";
import { useOfficeStore } from "@/store/office.js";
import { useToast } from "@/composables/useToast";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { stagger } from "@/composables/useStagger";

const officeStore = useOfficeStore();
const toast = useToast();

const showModal = ref(false);
const selectedOffice = ref(null);
const saving = ref(false);

onMounted(() => officeStore.fetchOffices());

function openOffice(office) {
  selectedOffice.value = { ...office, name: office.office_name };
  showModal.value = true;
}

async function saveOffice() {
  if (!selectedOffice.value.name) {
    toast.error("Office name is required");
    return;
  }
  saving.value = true;
  const payload = {
    office_name: selectedOffice.value.name,
    type: selectedOffice.value.type,
    status: selectedOffice.value.status,
  };
  try {
    await officeStore.updateOffice(selectedOffice.value.id, payload);
    toast.success("Office updated");
    showModal.value = false;
  } catch (err) {
    toast.error(err?.message || "Failed to update office");
  } finally {
    saving.value = false;
  }
}

function closeModal() {
  showModal.value = false;
  selectedOffice.value = null;
}

function statusTone(s) {
  const v = (s || "").toLowerCase();
  if (v === "available") return "bg-emerald-50 text-emerald-700";
  if (v === "busy") return "bg-amber-50 text-amber-700";
  if (v === "not available") return "bg-rose-50 text-rose-700";
  return "bg-[var(--paper-2)] text-[var(--ink-2)]";
}
function statusDot(s) {
  const v = (s || "").toLowerCase();
  if (v === "available") return "bg-emerald-500";
  if (v === "busy") return "bg-amber-500";
  if (v === "not available") return "bg-rose-500";
  return "bg-slate-400";
}
function statusLabel(s) {
  const v = (s || "available").toLowerCase();
  if (v === "not available") return "Not available";
  return v[0].toUpperCase() + v.slice(1);
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <header class="rise mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="eyebrow">Locations</p>
        <h1 class="mt-2 text-4xl font-bold tracking-tight">Offices</h1>
        <p class="lede mt-2 max-w-xl">
          All registered office locations and their live status. Click a card to edit.
        </p>
      </div>
      <AppButton variant="secondary" :loading="officeStore.fetchingOffices" @click="officeStore.fetchOffices()">
        Refresh
      </AppButton>
    </header>

    <div v-if="officeStore.fetchingOffices && !officeStore.offices.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" height="160" />
    </div>
    <div v-else-if="!officeStore.offices.length">
      <EmptyState icon="users" title="No offices yet" description="Add offices to start tracking visitors." />
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="(office, i) in officeStore.offices"
        :key="office.id"
        type="button"
        :class="stagger(i)"
        class="surface group p-6 text-left transition hover:-translate-y-0.5"
        @click="openOffice(office)"
      >
        <div class="flex items-start justify-between gap-3">
          <p class="font-display text-2xl font-bold tracking-tight">
            {{ office.office_name }}
          </p>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="statusTone(office.status)"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="statusDot(office.status)"></span>
            {{ statusLabel(office.status) }}
          </span>
        </div>
        <div class="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4 text-sm">
          <div>
            <p class="text-xs text-[var(--ink-3)]">Type</p>
            <p class="mt-0.5 font-medium">{{ office.type || "Standard" }}</p>
          </div>
          <div>
            <p class="text-xs text-[var(--ink-3)]">Queue</p>
            <p class="mt-0.5 font-display font-semibold tabular">{{ office.queue_count ?? 0 }}</p>
          </div>
        </div>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="slide-up">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          @click.self="closeModal"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div class="surface-raised relative w-full max-w-md p-6">
            <div class="mb-5 flex items-center justify-between">
              <h2 class="font-display text-xl font-bold">Edit office</h2>
              <button class="btn btn-ghost btn-sm" @click="closeModal">Close</button>
            </div>
            <div v-if="selectedOffice" class="space-y-4">
              <div>
                <label class="label">Office name</label>
                <input v-model="selectedOffice.name" type="text" class="input" />
              </div>
              <div>
                <label class="label">Type</label>
                <input v-model="selectedOffice.type" type="text" class="input" />
              </div>
              <div>
                <label class="label">Status</label>
                <select v-model="selectedOffice.status" class="select">
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="not available">Not available</option>
                </select>
              </div>
            </div>
            <div class="mt-6 flex gap-2 border-t border-[var(--line)] pt-4">
              <AppButton variant="ghost" @click="closeModal" block>Cancel</AppButton>
              <AppButton variant="primary" :loading="saving" @click="saveOffice" block>
                Save
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-up-enter-from { opacity: 0; transform: translateY(12px); }
.slide-up-leave-to { opacity: 0; transform: translateY(8px); }
</style>
