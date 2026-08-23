<template>
  <div class="public-shell">
    <header class="public-shell__header">
      <router-link to="/" class="public-shell__brand" aria-label="BSU Visitor home">
        <img src="/logo/BatStateU-NEU-Logo-1-300x282.png" alt="" />
        <span><strong>BSU Visitor</strong><small>Batangas State University · NEU</small></span>
      </router-link>
      <nav aria-label="Public navigation" class="public-shell__nav">
        <router-link v-for="item in publicNavigation" :key="item.to" :to="item.to" :class="{ active: route.path === item.to }">{{ item.label }}</router-link>
      </nav>
      <router-link to="/login" class="public-shell__login">Sign in</router-link>
    </header>
    <main>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { publicNavigation } from "@/config/navigation";
const route = useRoute();
</script>
