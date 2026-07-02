<template>
  <!--
    Authenticated app shell.
    One navbar (the BSU-red one) at the top, then the routed page.
    The old Sidebar-with-its-own-navbar is gone — that was the
    "two headers stacked" bug the user was complaining about.
  -->
  <div class="min-h-screen bg-[var(--bsu-paper)] text-[var(--bsu-ink)]">
    <Navbar />
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <router-view />
    </main>
    <Toast />
    <!--
      Floating global alarm banner. Plays /alarm.mp3 and surfaces a
      "Sign out" button on every page when a visit is overdue. Only
      renders anything when overdue > 0, so non-security users never
      see it.
    -->
    <SecurityAlarmWidget v-if="showSecurityAlarm" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import Navbar from "@/components/Navbar.vue";
import Toast from "@/components/Toast.vue";
import SecurityAlarmWidget from "@/components/SecurityAlarmWidget.vue";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();
// Use the same getter the rest of the app uses (`userRole` returns
// `currentUser.role_id`, which is the canonical security/admin/staff
// discriminator). role_id 2 = security.
const showSecurityAlarm = computed(
  () => Number(userStore.userRole) === 2,
);
</script>
