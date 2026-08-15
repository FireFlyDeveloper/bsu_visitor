<template>
  <div class="app-shell">
    <button
      v-if="drawerOpen"
      class="app-shell__scrim"
      aria-label="Close navigation"
      @click="closeDrawer"
    />
    <aside class="app-shell__sidebar" :class="{ 'app-shell__sidebar--open': drawerOpen }">
      <div class="app-shell__brand-row">
        <router-link to="/" class="app-shell__brand" @click="closeDrawer">
          <img src="/logo/BatStateU-NEU-Logo-1-300x282.png" alt="" />
          <span><strong>BSU Visitor</strong><small>Operations portal</small></span>
        </router-link>
        <button class="app-shell__close" aria-label="Close navigation" @click="closeDrawer">×</button>
      </div>
      <div class="app-shell__context">
        <span class="app-shell__context-dot" />
        <span>Authenticated workspace</span>
      </div>
      <nav aria-label="Operations navigation" class="app-shell__nav">
        <p class="app-shell__nav-label">{{ roleNames[roleKey] || "Workspace" }}</p>
        <router-link
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="app-shell__link"
          :class="{ 'app-shell__link--active': isActive(item.to) }"
          @click="closeDrawer"
        >
          <span class="app-shell__icon" aria-hidden="true"><Icon :name="item.icon" /></span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="app-shell__account">
        <div class="app-shell__user">
          <span class="app-shell__avatar">{{ initials }}</span>
          <span><strong>{{ displayName }}</strong><small>{{ roleNames[roleKey] }}</small></span>
        </div>
        <button class="app-shell__signout" @click="onLogout">Sign out</button>
      </div>
    </aside>
    <div class="app-shell__body">
      <header class="app-shell__mobile-header">
        <button class="app-shell__menu" aria-label="Open navigation" :aria-expanded="drawerOpen" @click="openDrawer">☰</button>
        <span class="app-shell__mobile-title">{{ currentTitle }}</span>
        <span class="app-shell__mobile-role">{{ roleNames[roleKey] }}</span>
      </header>
      <main class="app-shell__main"><router-view /></main>
    </div>
    <Toast />
    <SecurityAlarmWidget v-if="showSecurityAlarm" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Toast from "@/components/Toast.vue";
import SecurityAlarmWidget from "@/components/SecurityAlarmWidget.vue";
import { useUserStore } from "@/store/user";
import { roleNames, roleNavigation, roleKeyFromId } from "@/config/navigation";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const drawerOpen = ref(false);
const roleKey = computed(() => roleKeyFromId(userStore.userRole));
const navItems = computed(() => roleNavigation[roleKey.value] || []);
const showSecurityAlarm = computed(() => roleKey.value === "security");
const displayName = computed(() => userStore.currentUser?.fullname || userStore.currentUser?.username || "Account");
const initials = computed(() => displayName.value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase());
const currentTitle = computed(() => navItems.value.find((item) => isActive(item.to))?.label || "Operations");

function isActive(to) {
  const path = to.split("#")[0];
  return route.path === path || (path !== "/" && route.path.startsWith(`${path}/`));
}
function openDrawer() { drawerOpen.value = true; }
function closeDrawer() { drawerOpen.value = false; }
async function onLogout() {
  closeDrawer();
  await userStore.logout().catch(() => null);
  router.push({ name: "Login" });
}
function onKeydown(event) { if (event.key === "Escape") closeDrawer(); }
watch(() => route.fullPath, closeDrawer);
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<script>
const iconPaths = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  building: "M4 20V5l8-2 8 2v15M8 8h1m6 0h1M8 12h1m6 0h1M8 16h1m6 0h1M12 20v-4",
  users: "M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6.5-7.5a4 4 0 0 1 0 7.75M21 20v-2a4 4 0 0 0-3-3.87",
  user: "M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM19 18h1v2h-2",
  queue: "M4 6h16M4 12h16M4 18h10M17 17l2 2 3-4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2",
  id: "M4 5h16v14H4zM8 10h3M8 14h5M15 10h2",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
};
const Icon = { props: { name: String }, template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="paths[name]" /></svg>`, computed: { paths() { return iconPaths; } } };
</script>
