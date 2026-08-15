<template>
  <!--
    Authenticated app shell.
    One navbar (the BSU-red one) at the top, then the routed page.
    The old Sidebar-with-its-own-navbar is gone — that was the
    "two headers stacked" bug the user was complaining about.
  -->
  <AppShell />
</template>

<script setup>
import AppShell from "@/layouts/AppShell.vue";
</script>
