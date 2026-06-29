<template>
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
    <p class="text-gray-800 mt-2">View all users and their last activity</p>
  </div>

  <div v-if="userStore.loading" class="flex justify-center items-center h-64">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"
    ></div>
  </div>

  <div
    v-if="userStore.error"
    class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
  >
    {{ userStore.error }}
  </div>

  <button
    @click="showCreateUser = true"
    class="bg-red-800 text-white px-4 py-2 rounded-xl"
  >
    Create User
  </button>

  <BaseModal v-model="showCreateUser">
    <template #header>
      <h2 class="text-xl font-semibold">Create User Account</h2>
    </template>

    <CreateUserForm @created="handleUserCreated" />
  </BaseModal>

  <div
    v-if="!userStore.loading && userStore.users.length > 0"
    class="bg-white rounded-lg shadow overflow-hidden"
  >
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100 border-b border-gray-200">
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
            >
              ID
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
            >
              Full Name
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
            >
              Username
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
            >
              Role
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="user in userStore.users"
            :key="user.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
            >
              {{ user.id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ user.fullname }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
              {{ user.username }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span
                :class="getRoleClass(user.role_id)"
                class="px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ getRoleName(user.role_id) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div
    v-if="!userStore.loading && userStore.users.length === 0"
    class="bg-white rounded-lg shadow p-8 text-center"
  >
    <p class="text-gray-500 text-lg">No users found</p>
  </div>

  <div
    v-if="!userStore.loading && userStore.users.length > 0"
    class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
  >
    <p class="text-blue-900">
      Total users:
      <span class="text-blue-800">{{ userStore.users.length }}</span>
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { onMounted } from "vue";
import BaseModal from "../../components/BaseModal.vue";
import CreateUserForm from "../../components/CreateAccountForm.vue";
import { useUserStore } from "../../store/user.js";

const userStore = useUserStore();
const showCreateUser = ref(false);

const roleMap = {
  1: "Admin",
  2: "Security",
  3: "Staff",
};

onMounted(() => {
  userStore.fetchAllUsers();
});

async function handleUserCreated() {
  await userStore.fetchAllUsers();
  showCreateUser.value = false;
}


function getRoleName(roleId) {
  return roleMap[roleId] || "Unknown";
}

function getRoleClass(roleId) {
  return (
    {
      1: "bg-red-100 text-red-800",
      2: "bg-blue-100 text-blue-800",
      3: "bg-green-100 text-green-800",
    }[roleId] || "bg-gray-100 text-gray-800"
  );
}
</script>
