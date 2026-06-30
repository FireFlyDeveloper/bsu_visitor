<template>
  <Navbar />
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <div class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <header class="rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">People</p>
          <h1 class="mt-2 text-4xl font-bold tracking-tight">User management</h1>
          <p class="lede mt-2">
            All accounts in the system. Create admins, security, and staff.
          </p>
        </div>
        <AppButton variant="primary" @click="showCreateUser = true">
          Create user
        </AppButton>
      </header>

      <div v-if="userStore.loading && !userStore.users.length" class="surface p-6 space-y-2">
        <Skeleton v-for="i in 5" :key="i" height="48" />
      </div>

      <div v-else-if="!userStore.users.length">
        <EmptyState
          icon="users"
          title="No users yet"
          description="Create your first account to get started."
        />
      </div>

      <section v-else class="surface overflow-hidden rise rise-delay-1">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--line)] bg-[var(--paper-2)]/40 text-left text-[0.6875rem] uppercase tracking-wider text-[var(--ink-3)]">
              <th class="px-6 py-3 font-semibold">Name</th>
              <th class="px-6 py-3 font-semibold">Username</th>
              <th class="px-6 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--line)]">
            <tr
              v-for="(user, i) in userStore.users"
              :key="user.id"
              :class="stagger(i)"
              class="transition-colors hover:bg-[var(--paper-2)]/40"
            >
              <td class="px-6 py-4">
                <p class="font-semibold">{{ user.fullname }}</p>
              </td>
              <td class="px-6 py-4 font-mono text-xs tabular text-[var(--ink-2)]">
                {{ user.username }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="roleTone(user.role_id)"
                >
                  {{ roleName(user.role_id) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="border-t border-[var(--line)] px-6 py-3 text-xs text-[var(--ink-3)]">
          Total: <span class="font-semibold text-[var(--ink)] tabular">{{ userStore.users.length }}</span>
        </div>
      </section>

      <BaseModal v-model="showCreateUser">
        <template #header>
          <h2 class="font-display text-xl font-bold">Create user account</h2>
        </template>
        <CreateUserForm @created="handleUserCreated" />
      </BaseModal>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Navbar from "@/components/Navbar.vue";
import BaseModal from "@/components/BaseModal.vue";
import CreateUserForm from "@/components/CreateAccountForm.vue";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useUserStore } from "@/store/user.js";
import { stagger } from "@/composables/useStagger";

const userStore = useUserStore();
const showCreateUser = ref(false);

const roleMap = { 1: "Admin", 2: "Security", 3: "Staff" };
const roleToneMap = {
  1: "bg-rose-50 text-rose-700",
  2: "bg-sky-50 text-sky-700",
  3: "bg-emerald-50 text-emerald-700",
};
const roleName = (id) => roleMap[id] || "Unknown";
const roleTone = (id) => roleToneMap[id] || "bg-[var(--paper-2)] text-[var(--ink-2)]";

async function handleUserCreated() {
  await userStore.fetchAllUsers();
  showCreateUser.value = false;
}

onMounted(() => userStore.fetchAllUsers());
</script>
