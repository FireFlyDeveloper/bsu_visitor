<template>
  <header
    v-if="!route.meta.publicShell"
    class="sticky top-0 z-50 border-b-2 border-[var(--bsu-red)] bg-white transition-shadow"
    :class="{ 'shadow-[0_2px_8px_rgba(208,17,43,0.08)]': scrolled }"
  >
    <!-- Top accent strip -->
    <div class="h-1 bg-[var(--bsu-red)]"></div>

    <div
      class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
    >
      <!-- Brand: BSU mark + wordmark -->
      <router-link
        to="/"
        class="flex items-center gap-3"
        aria-label="BSU Visitor home"
      >
        <img
          src="/logo/BatStateU-NEU-Logo-1-300x282.png"
          alt="BatStateU NEU"
          class="h-11 w-11 object-contain"
        />
        <div class="hidden sm:block">
          <p
            class="font-display text-[0.95rem] font-bold leading-tight tracking-tight text-[var(--bsu-ink)]"
          >
            BSU Visitor
          </p>
          <p class="text-[0.6875rem] font-medium text-[var(--bsu-red)]">
            Batangas State University · NEU
          </p>
        </div>
      </router-link>

      <!-- Center nav (desktop) -->
      <div class="hidden flex-1 justify-center md:flex">
        <div class="flex items-center gap-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="group relative px-3 py-1.5 text-sm font-semibold tracking-wide text-[var(--bsu-ink-2)] transition-colors hover:text-[var(--bsu-red)]"
            active-class="text-[var(--bsu-red)]"
            exact-active-class="text-[var(--bsu-red)]"
          >
            {{ item.name }}
            <span
              class="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-[var(--bsu-red)] transition-transform duration-300 group-hover:scale-x-100"
              :class="{ 'scale-x-100': isActive(item.path) }"
            />
          </router-link>
        </div>
      </div>

      <!-- Right: user + Bagong Pilipinas + mobile menu -->
      <div class="flex items-center gap-3">
        <div
          v-if="userStore.currentUser"
          class="hidden items-center gap-2 sm:flex"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bsu-red)] text-xs font-bold text-white"
          >
            {{ initials }}
          </div>
          <div class="hidden text-right lg:block">
            <p class="text-xs font-semibold text-[var(--bsu-ink)]">
              {{ userStore.currentUser.fullname || userStore.currentUser.username }}
            </p>
            <p class="text-[0.6875rem] capitalize text-[var(--bsu-red)]">
              {{ userStore.currentUser.role?.name || roleLabel }}
            </p>
          </div>
          <button
            class="btn btn-ghost btn-sm"
            @click="onLogout"
          >
            Sign out
          </button>
        </div>
        <img
          src="/logo/BAGONG_PILIPINAS_LOGO-e1693281031955.png"
          alt="Bagong Pilipinas"
          class="hidden h-9 w-9 object-contain lg:block"
        />
        <button
          class="rounded-lg p-2 text-[var(--bsu-ink-2)] hover:bg-[var(--bsu-paper-2)] md:hidden"
          @click="mobileOpen = !mobileOpen"
          aria-label="Toggle menu"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              v-if="!mobileOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide-down">
      <div
        v-if="mobileOpen"
        class="border-t border-[var(--bsu-line)] bg-white px-4 py-3 md:hidden"
      >
        <div class="flex flex-col gap-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--bsu-ink-2)] hover:bg-[var(--bsu-paper-2)]"
            active-class="bg-[var(--bsu-red-soft)] text-[var(--bsu-red)]"
            exact-active-class="bg-[var(--bsu-red-soft)] text-[var(--bsu-red)]"
            @click="mobileOpen = false"
          >
            {{ item.name }}
          </router-link>
          <button
            v-if="userStore.currentUser"
            class="btn btn-secondary mt-2"
            @click="onLogout"
          >
            Sign out
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/store/user.js";

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const mobileOpen = ref(false);
const scrolled = ref(false);

const navigation = {
  null: [
    { name: "Directory", path: "/directory" },
    { name: "Register", path: "/register" },
    { name: "Status", path: "/status" },
    { name: "Sign in", path: "/login" },
  ],
  admin: [
    { name: "Availability", path: "/" },
    { name: "Visitor Log", path: "/visitors/logs" },
    { name: "Admin Dashboard", path: "/admin/dashboard" },
  ],
  staff: [
    { name: "Availability", path: "/" },
    { name: "Visitor Log", path: "/visitors/logs" },
    { name: "Staff Dashboard", path: "/staff/dashboard" },
  ],
  security: [
    { name: "Kiosk", path: "/security/kiosk" },
    { name: "Availability", path: "/" },
    { name: "Visitor Log", path: "/visitors/logs" },
    { name: "Security Panel", path: "/security/visitors/status" },
  ],
};

const roleKey = computed(() => {
  const r = userStore.userRole;
  if (r === 1) return "admin";
  if (r === 2) return "security";
  if (r === 3) return "staff";
  return null;
});

const navItems = computed(() => navigation[roleKey.value] || []);

const initials = computed(() => {
  const u = userStore.currentUser;
  if (!u) return "·";
  const src = u.fullname || u.username || "";
  return (
    src
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join("") || "·"
  );
});

// Human-readable role label for the header pill.
// Backend returns role as { id, name }; fall back to the roleKey string.
const roleLabel = computed(() => {
  const u = userStore.currentUser;
  if (!u) return "";
  if (u.role && typeof u.role === "object") return u.role.name || roleKey.value;
  if (typeof u.role === "string") return u.role;
  return roleKey.value || "";
});

function isActive(path) {
  if (path === "/") return route.path === "/";
  return route.path === path || route.path.startsWith(path + "/");
}

function onLogout() {
  userStore.logout();
  router.push("/login");
}

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  if (!userStore.currentUser) {
    userStore.fetchCurrentUser();
  }
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
