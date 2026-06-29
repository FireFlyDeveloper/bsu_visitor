<template>
  <nav
    class="flex items-center justify-between bg-white px-7 py-2 shadow-lg sticky top-0 z-50 border-b-amber-300 border-b-2 transition-transform duration-300"
    :class="{ '-translate-y-full': !isVisible }"
  >
    <!-- LEFT LOGO -->
    <div class="flex items-center shrink-0">
      <router-link to="/" class="block">
        <div
          class="w-16 h-16 md:w-20 md:h-20 lg:w-25 lg:h-25 flex items-center justify-center"
        >
          <img
            src="/logo/BatStateU-NEU-Logo-1-300x282.png"
            alt="BatStateU Logo"
            class="max-w-full max-h-full"
          />
        </div>
      </router-link>
    </div>

    <!-- MOBILE HAMBURGER -->
    <div class="flex items-center md:hidden">
      <button
        @click="isMenuOpen = !isMenuOpen"
        class="p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
      >
        <span class="text-2xl">☰</span>
      </button>
    </div>

    <!-- DESKTOP NAV -->
    <div class="hidden md:flex items-center gap-1 md:gap-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-link px-3 py-1 md:px-5 md:py-2 uppercase font-semibold text-xs md:text-sm tracking-wide hover:bg-yellow-400/10 transition-all duration-200"
        active-class="text-amber-700 font-bold border-b-1 border-red-700"
        exact-active-class="text-amber-700 font-bold border-b-1 border-red-700"
      >
        {{ item.name }}
      </router-link>
    </div>

    <!-- RIGHT LOGO -->
    <div class="flex items-center shrink-0 hidden md:flex">
      <div
        class="w-16 h-16 md:w-20 md:h-20 lg:w-25 lg:h-25 bg-white/5 flex items-center justify-center"
      >
        <img
          src="/logo/BAGONG_PILIPINAS_LOGO-e1693281031955.png"
          alt=""
          class="max-w-full max-h-full"
        />
      </div>
    </div>
  </nav>

  <!-- MOBILE MENU -->
  <div
    v-if="isMenuOpen"
    class="md:hidden bg-white shadow-lg border-t border-gray-200 px-4 py-3"
  >
    <div class="flex flex-col gap-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="px-3 py-2 rounded font-semibold text-sm bg-yellow-100 hover:bg-yellow-200"
        active-class="text-amber-700 font-bold bg-yellow-200"
        exact-active-class="text-amber-700 font-bold bg-yellow-200"
        @click="isMenuOpen = false"
      >
        {{ item.name }}
      </router-link>
    </div>
  </div>
</template>

<script>
import { useUserStore } from "../store/user.js";

export default {
  name: "Navbar",

  data() {
    return {
      isVisible: true,
      lastScrollTop: 0,
      isMenuOpen: false,

      // NAVIGATION DICTIONARY
      navigation: {
        null: [{ name: "Login", path: "/login" }],

        admin: [
          { name: "Availability", path: "/" },
          { name: "Register Visitor", path: "/visitors/create" },
          { name: "Visitor Log", path: "/visitors/logs" },
          { name: "QR Codes", path: "/qr-code" },
          { name: "Admin Dashboard", path: "/admin/dashboard" },
        ],

        staff: [
          { name: "Availability", path: "/" },
          { name: "Register Visitor", path: "/visitors/create" },
          { name: "Visitor Log", path: "/visitors/logs" },
          { name: "QR Codes", path: "/qr-code" },
          { name: "Staff Dashboard", path: "/staff/dashboard" },
        ],

        security: [
          { name: "Availability", path: "/" },
          { name: "Register Visitor", path: "/visitors/create" },
          { name: "Visitor Log", path: "/visitors/logs" },
          { name: "QR Codes", path: "/qr-code" },
          { name: "Security Panel", path: "/security/visitors/status" },
        ],
      },
    };
  },

  computed: {
    userStore() {
      return useUserStore();
    },

    roleKey() {
      const role = this.userStore.userRole;

      if (role === 1) return "admin";
      if (role === 2) return "security";
      if (role === 3) return "staff";

      return null;
    },

    navItems() {
      return this.navigation[this.roleKey] || [];
    },
  },

  mounted() {
    window.addEventListener("scroll", this.handleScroll);

    if (!this.userStore.currentUser) {
      this.userStore.fetchCurrentUser();
    }
  },

  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },

  methods: {
    handleScroll() {
      const currentScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      if (currentScrollTop > this.lastScrollTop && currentScrollTop > 100) {
        this.isVisible = false;
      } else {
        this.isVisible = true;
      }

      this.lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    },
  },
};
</script>

<style scoped>
.nav-link {
  position: relative;
  overflow: visible;
}

.nav-link::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 2px;
  background-color: #8c2910;
  transition:
    width 0.25s ease,
    left 0.25s ease;
}

.nav-link:hover::after {
  width: 100%;
  left: 0;
}

.nav-link.router-link-active::after,
.nav-link.router-link-exact-active::after {
  width: 100%;
  left: 0;
}
</style>
