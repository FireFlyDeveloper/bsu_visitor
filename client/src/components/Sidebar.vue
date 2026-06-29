<template>
  <div class="min-h-screen bg-gray-50">
    <!-- TOP NAVBAR -->
    <nav
      class="flex items-center justify-between bg-white px-4 py-3 shadow fixed top-0 left-0 right-0 z-50 border-b border-slate-200"
    >
      <router-link to="/" class="flex items-center gap-2">
        <img
          src="/logo/BatStateU-NEU-Logo-1-300x282.png"
          alt="BatStateU Logo"
          class="w-10 h-10 object-contain"
        />
        <span class="font-bold text-lg text-slate-900">BatStateU</span>
      </router-link>

      <button
        class="md:hidden p-2 rounded-md border border-slate-300 bg-white hover:bg-slate-100"
        @click="isMenuOpen = !isMenuOpen"
      >
        <span class="text-2xl">☰</span>
      </button>
    </nav>

    <!-- DESKTOP SIDEBAR -->
    <aside
      class="hidden md:flex flex-col fixed left-0 top-16.25 h-[calc(100vh-65px)] w-64 border-r border-slate-200 bg-white pb-4 px-4 pt-4 shadow-sm z-40"
    >
      <!-- NAV LINKS -->
      <nav class="flex flex-col gap-2 flex-1">
        <router-link
          v-for="item in sidebarItems"
          :key="item.path"
          :to="item.path"
          class="sidebar-link"
          active-class="active"
          exact-active-class="active"
        >
          {{ item.name }}
        </router-link>
      </nav>

      <!-- LOGOUT -->
      <Logout />
    </aside>

    <!-- MOBILE SIDEBAR -->
    <Transition name="fade">
      <div
        v-if="isMenuOpen"
        class="fixed inset-0 z-40 bg-black/40 md:hidden"
        @click.self="isMenuOpen = false"
      >
        <Transition name="slide">
          <aside
            class="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-xl flex flex-col"
          >
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                <img
                  src="/logo/BatStateU-NEU-Logo-1-300x282.png"
                  class="w-8 h-8 object-contain"
                />
                <h2 class="text-lg font-semibold text-slate-800">BatStateU</h2>
              </div>

              <button
                @click="isMenuOpen = false"
                class="text-2xl text-slate-500"
              >
                ✕
              </button>
            </div>

            <!-- MOBILE LINKS -->
            <nav class="flex flex-col gap-2 flex-1">
              <router-link
                v-for="item in sidebarItems"
                :key="item.path"
                :to="item.path"
                class="sidebar-link"
                active-class="active"
                exact-active-class="active"
                @click="isMenuOpen = false"
              >
                {{ item.name }}
              </router-link>
            </nav>

            <!-- MOBILE LOGOUT -->
            <Logout />
          </aside>
        </Transition>
      </div>
    </Transition>

    <!-- MAIN CONTENT -->
    <main class="pt-16.25 md:ml-64">
      <div class="p-8">
        <slot>
          <div class="text-gray-500">Main content goes here.</div>
        </slot>
      </div>
    </main>
  </div>
</template>

<script>
import Logout from "./Logout.vue";
import { useUserStore } from "../store/user.js";

export default {
  name: "Sidebar",

  components: {
    Logout,
  },

  data() {
    return {
      isMenuOpen: false,

      // ROLE-BASED NAVIGATION
      navigation: {
        admin: [
          { name: "Dashboard", path: "/admin/dashboard" },
          { name: "Users", path: "/admin/users" },
          { name: "Offices", path: "/admin/offices" },
        ],

        staff: [
          { name: "Dashboard", path: "/staff/dashboard" },
          { name: "Visitor Queue", path: "/staff/visitors/queue" },
          { name: "Visitor Logs", path: "/staff/visitors/logs" },
          { name: "Visitor Profiles", path: "/staff/visitors" },
        ],

        security: [
          { name: "Visitor Status", path: "/security/visitors/status" },
          { name: "Security Panel", path: "/security" },
          { name: "Office Status", path: "/security/offices/status" },
        ],
      },
    };
  },

  computed: {
    userStore() {
      return useUserStore();
    },

    // MAP ROLE ID → ROLE KEY
    roleKey() {
      const role = this.userStore.userRole;

      if (role === 1) return "admin";
      if (role === 2) return "security";
      if (role === 3) return "staff";

      return null;
    },

    // FINAL SIDEBAR ITEMS
    sidebarItems() {
      return this.navigation[this.roleKey] || [];
    },
  },

  mounted() {
    if (!this.userStore.currentUser) {
      this.userStore.fetchCurrentUser();
    }
  },

  watch: {
    $route() {
      this.isMenuOpen = false;
    },
  },
};
</script>

<style scoped>
.sidebar-link {
  display: block;
  padding: 0.65rem 0.75rem;
  border-radius: 0.5rem;
  color: #334155;
  font-weight: 600;
  transition: all 0.2s ease;
}

.sidebar-link:hover {
  transform: translateX(4px);
  background-color: #f8fafc;
  color: #1d4ed8;
}

.sidebar-link.active {
  color: #1d4ed8;
  background-color: #eff6ff;
}

/* overlay fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* slide animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
