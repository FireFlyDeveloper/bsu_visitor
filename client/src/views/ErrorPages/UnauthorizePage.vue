<template>
  <Navbar />
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="text-center p-8 bg-white shadow rounded-2xl">
      <h1 class="text-3xl font-bold text-red-600">403 - Unauthorized</h1>
      <p class="mt-2 text-slate-600">
        You do not have permission to access this page.
      </p>

      <router-link
        to="/"
        class="inline-block mt-6 px-4 py-2 bg-red-800 text-white! rounded-lg hover:bg-slate-700"
      >
        Go Back Home
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from "../../components/Navbar.vue";
</script>
