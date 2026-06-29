<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- BACKDROP -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <!-- MODAL CARD -->
        <div
          class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 z-10"
        >
          <!-- CLOSE BUTTON -->
          <button
            @click="close"
            class="absolute top-3 right-3 text-slate-500 hover:text-slate-800 transition"
          >
            ✕
          </button>

          <!-- HEADER -->
          <div v-if="$slots.header" class="mb-4 border-b pb-3">
            <slot name="header"></slot>
          </div>

          <!-- BODY -->
          <div class="mb-4">
            <slot></slot>
          </div>

          <!-- FOOTER -->
          <div
            v-if="$slots.footer"
            class="border-t pt-3 flex justify-end gap-2"
          >
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const close = () => {
  emit("update:modelValue", false);
};

// ESC key support
const handleKey = (e) => {
  if (e.key === "Escape") {
    close();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKey);
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95); 
}
</style>
