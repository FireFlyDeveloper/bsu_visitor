<template>
  <Navbar />
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <header class="rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Directory</p>
          <h1 class="mt-2 text-4xl font-bold tracking-tight">Visitors</h1>
          <p class="lede mt-2 max-w-xl">
            Every person who has ever checked in. Click a card to edit details.
          </p>
        </div>
      </header>

      <div v-if="visitorStore.loading && !visitorStore.visitors.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="i in 8" :key="i" height="220" />
      </div>
      <EmptyState
        v-else-if="!visitorStore.visitors.length"
        icon="users"
        title="No visitors yet"
        description="Visitors appear here after their first check-in at the kiosk."
      />

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article
          v-for="(visitor, i) in visitorStore.visitors"
          :key="visitor.id"
          :class="stagger(i)"
          class="surface group overflow-hidden"
        >
          <div class="relative aspect-[4/3] overflow-hidden bg-[var(--paper-2)]">
            <img
              :src="getImageUrl(visitor.img)"
              :alt="visitor.fullname"
              @error="handleImageError"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span
              v-if="visitor.id_type"
              class="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--ink-2)] backdrop-blur"
            >
              {{ visitor.id_type }}
            </span>
          </div>
          <div class="p-4">
            <h3 class="truncate font-display text-lg font-bold tracking-tight">
              {{ visitor.fullname }}
            </h3>
            <div class="mt-2 space-y-1 text-sm text-[var(--ink-2)]">
              <p class="flex items-center gap-2 truncate">
                <svg class="h-3.5 w-3.5 text-[var(--ink-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span class="truncate tabular">{{ visitor.contact_number }}</span>
              </p>
              <p class="flex items-center gap-2 truncate">
                <svg class="h-3.5 w-3.5 text-[var(--ink-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M17.657 16.657 13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
                </svg>
                <span class="truncate">{{ visitor.address || "No address" }}</span>
              </p>
            </div>
            <div class="mt-4 flex gap-2 border-t border-[var(--line)] pt-3">
              <button class="btn btn-secondary btn-sm flex-1" @click="openEdit(visitor)">Edit</button>
              <button class="btn btn-danger btn-sm flex-1" @click="openDelete(visitor)">Delete</button>
            </div>
          </div>
        </article>
      </div>

      <div v-if="visitorStore.visitors.length" class="flex items-center justify-between border-t border-[var(--line)] pt-4">
        <p class="text-xs text-[var(--ink-3)]">
          Page <span class="tabular text-[var(--ink-2)]">{{ visitorStore.page || 1 }}</span>
        </p>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-sm" :disabled="(visitorStore.page || 1) <= 1 || visitorStore.loading" @click="prevPage">← Previous</button>
          <button class="btn btn-ghost btn-sm" :disabled="visitorStore.loading" @click="nextPage">Next →</button>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" @click.self="closeEditModal">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div class="surface-raised relative w-full max-w-md p-6">
            <h2 class="font-display text-xl font-bold">{{ isAdding ? "Add visitor" : "Edit visitor" }}</h2>
            <div class="mt-5 space-y-3">
              <div>
                <label class="label">Full name</label>
                <input v-model="selected.fullname" type="text" class="input" />
              </div>
              <div>
                <label class="label">Contact number</label>
                <input v-model="selected.contact_number" type="text" class="input" />
              </div>
              <div>
                <label class="label">Address</label>
                <input v-model="selected.address" type="text" class="input" />
              </div>
              <div>
                <label class="label">ID type</label>
                <input v-model="selected.id_type" type="text" class="input" />
              </div>
              <div v-if="isAdding">
                <label class="label">Profile image</label>
                <input type="file" accept="image/*" @change="handleImageUpload" class="input file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ink)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
              </div>
            </div>
            <div class="mt-6 flex gap-2 border-t border-[var(--line)] pt-4">
              <AppButton variant="ghost" @click="closeEditModal" block>Cancel</AppButton>
              <AppButton variant="primary" :loading="saving" @click="saveVisitor" block>
                {{ isAdding ? "Add" : "Save" }}
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete confirm -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeDeleteModal">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div class="surface-raised relative w-full max-w-sm p-6 text-center">
            <h2 class="font-display text-xl font-bold text-[var(--bad)]">Delete visitor?</h2>
            <p class="mt-2 text-sm text-[var(--ink-2)]">
              <strong class="text-[var(--ink)]">{{ selected.fullname }}</strong>
              will be permanently removed. This action cannot be undone.
            </p>
            <div class="mt-6 flex gap-2">
              <AppButton variant="ghost" @click="closeDeleteModal" block>Cancel</AppButton>
              <AppButton variant="danger" @click="deleteVisitor" block>Delete</AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Navbar from "@/components/Navbar.vue";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useVisitorStore } from "@/store/visitor.js";
import { useToast } from "@/composables/useToast";
import { stagger } from "@/composables/useStagger";

const visitorStore = useVisitorStore();
const toast = useToast();

const API_BASE = import.meta.env.VITE_API_BASE;
const IMAGE_BASE = API_BASE.replace("/api", "");

const showEditModal = ref(false);
const showDeleteModal = ref(false);
const isAdding = ref(false);
const saving = ref(false);
const selectedImage = ref(null);

const selected = ref({
  id: null,
  fullname: "",
  contact_number: "",
  address: "",
  id_type: "",
  img: "",
});

function getImageUrl(path) {
  if (!path) return "https://picsum.photos/seed/visitor-placeholder/600/450";
  return `${IMAGE_BASE}/${path.replace(/^\//, "")}`;
}
function handleImageError(e) {
  e.target.src = "https://picsum.photos/seed/visitor-error/600/450";
}
function handleImageUpload(event) {
  selectedImage.value = event.target.files?.[0] || null;
}

async function nextPage() {
  if (visitorStore.loading) return;
  visitorStore.page = (visitorStore.page || 1) + 1;
  await visitorStore.fetchVisitors();
}
async function prevPage() {
  if (visitorStore.loading || (visitorStore.page || 1) <= 1) return;
  visitorStore.page = (visitorStore.page || 1) - 1;
  await visitorStore.fetchVisitors();
}

function openAdd() {
  isAdding.value = true;
  selected.value = { id: null, fullname: "", contact_number: "", address: "", id_type: "", img: "" };
  selectedImage.value = null;
  showEditModal.value = true;
}
function openEdit(visitor) {
  isAdding.value = false;
  selected.value = { ...visitor };
  selectedImage.value = null;
  showEditModal.value = true;
}
function closeEditModal() {
  showEditModal.value = false;
  selected.value = { id: null, fullname: "", contact_number: "", address: "", id_type: "", img: "" };
  selectedImage.value = null;
}

async function saveVisitor() {
  if (!selected.value.fullname || !selected.value.contact_number) {
    toast.error("Name and contact are required");
    return;
  }
  saving.value = true;
  try {
    if (isAdding.value) {
      if (selectedImage.value) {
        const fd = new FormData();
        fd.append("fullname", selected.value.fullname);
        fd.append("contact_number", selected.value.contact_number);
        fd.append("address", selected.value.address);
        fd.append("id_type", selected.value.id_type);
        fd.append("img", selectedImage.value);
        await visitorStore.addVisitorWithImage(fd);
      } else {
        await visitorStore.addVisitor(selected.value);
      }
    } else {
      await visitorStore.updateVisitor(selected.value.id, selected.value);
    }
    await visitorStore.fetchVisitors();
    toast.success(isAdding.value ? "Visitor added" : "Saved");
    closeEditModal();
  } catch (err) {
    toast.error(err?.message || "Failed to save visitor");
  } finally {
    saving.value = false;
  }
}

function openDelete(visitor) {
  selected.value = visitor;
  showDeleteModal.value = true;
}
function closeDeleteModal() {
  showDeleteModal.value = false;
}
async function deleteVisitor() {
  try {
    await visitorStore.deleteVisitor(selected.value.id);
    await visitorStore.fetchVisitors();
    toast.success("Visitor deleted");
    closeDeleteModal();
  } catch (err) {
    toast.error(err?.message || "Failed to delete visitor");
  }
}

onMounted(() => visitorStore.fetchVisitors());
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active { transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(12px); }
.slide-up-leave-to { opacity: 0; transform: translateY(8px); }
</style>
