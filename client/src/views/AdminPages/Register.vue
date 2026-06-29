<template>
  <div class="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(109,112,147,0.08)]">
    <h2 class="text-2xl font-semibold text-slate-950">Create User Account</h2>
    <p class="mt-2 text-slate-600">Register a new staff account for visitor management.</p>

    <form @submit.prevent="submitForm" class="mt-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700">Full Name</label>
        <input v-model="fullname" type="text" required class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700">Username</label>
        <input v-model="username" type="text" required class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700">Password</label>
        <input v-model="password" type="password" required class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none" />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-700">Role ID</label>
          <input v-model.number="roleId" type="number" min="1" required class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">Office ID</label>
          <input v-model.number="officeId" type="number" min="1" class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none" />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button type="submit" :disabled="loading" class="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
          {{ loading ? 'Creating...' : 'Create Account' }}
        </button>
        <span v-if="successMessage" class="text-sm text-emerald-600">{{ successMessage }}</span>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../store/user.js'

const userStore = useUserStore()
const fullname = ref('')
const username = ref('')
const password = ref('')
const roleId = ref(1)
const officeId = ref(null)
const error = ref('')
const successMessage = ref('')
const loading = ref(false)

async function submitForm() {
  error.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    await userStore.createAccount({
      fullname: fullname.value,
      username: username.value,
      password: password.value,
      role_id: roleId.value,
      office_id: officeId.value || null,
    })

    successMessage.value = 'Account created successfully.'
    fullname.value = ''
    username.value = ''
    password.value = ''
    roleId.value = 1
    officeId.value = null
  } catch (submissionError) {
    error.value = submissionError.message || 'Unable to create account.'
  } finally {
    loading.value = false
  }
}
</script>
