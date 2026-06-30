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
  </div>
</template>

<script setup>
import Navbar from "@/components/Navbar.vue";
import Toast from "@/components/Toast.vue";
</script>
