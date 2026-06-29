<template>
  <Sidebar>
    <router-view />
  </Sidebar>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";

export default {
  components: {
    Sidebar,
  },
};
</script>
