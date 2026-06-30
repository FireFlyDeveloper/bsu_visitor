import { ref } from "vue";

const toasts = ref([]);
let nextId = 1;

function push(message, type = "info", timeout = 3500) {
  const id = nextId++;
  toasts.value.push({ id, message, type });
  if (timeout > 0) {
    setTimeout(() => dismiss(id), timeout);
  }
  return id;
}

function dismiss(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

export function useToast() {
  return {
    toasts,
    info: (m, t) => push(m, "info", t),
    success: (m, t) => push(m, "success", t),
    error: (m, t) => push(m, "error", t ?? 5500),
    warn: (m, t) => push(m, "warn", t),
    dismiss,
  };
}
