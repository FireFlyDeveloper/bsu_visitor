<template>
  <button
    @click="handleLogout"
    class="w-full text-left px-3 py-2 rounded-md text-red-600 font-semibold hover:bg-red-50 transition flex items-center gap-2"
  >
    <LogOut class="w-5 h-5" />
    Logout
  </button>
</template>

<script>
import { LogOut } from "@lucide/vue";
import { useUserStore } from "../store/user.js";
import { useRouter } from "vue-router";

export default {
  name: "LogoutButton",

  components: {
    LogOut,
  },

  setup() {
    const userStore = useUserStore();
    const router = useRouter();

    const handleLogout = async () => {
      try {
        await userStore.logout();
        router.push("/login");
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    return { handleLogout };
  },
};
</script>
