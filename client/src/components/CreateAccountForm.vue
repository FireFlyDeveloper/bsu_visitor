<template>
  <p class="mt-2 text-slate-800">
    Register a new staff account for visitor management.
  </p>

  <form @submit.prevent="submitForm" class="mt-6 space-y-4">
    <!-- FULL NAME -->
    <div>
      <label class="block text-sm font-medium text-slate-700">Full Name</label>
      <input
        v-model="fullname"
        type="text"
        required
        class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none"
      />
    </div>

    <!-- USERNAME -->
    <div>
      <label class="block text-sm font-medium text-slate-700">Username</label>
      <input
        v-model="username"
        type="text"
        required
        class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none"
      />
    </div>

    <!-- PASSWORD -->
    <div>
      <label class="block text-sm font-medium text-slate-700">Password</label>
      <input
        v-model="password"
        type="password"
        required
        class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none"
      />
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <!-- ROLE DROPDOWN -->
      <div>
        <label class="block text-sm font-medium text-slate-700">Role</label>
        <select
          v-model="roleId"
          required
          class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none"
        >
          <option disabled value="">Select Role</option>
          <option v-for="role in roles" :key="role.id" :value="role.id">
            {{ role.role_name }}
          </option>
        </select>
      </div>

      <!-- OFFICE DROPDOWN -->
      <div>
        <label class="block text-sm font-medium text-slate-700">Office</label>
        <select
          v-model="officeId"
          :required="isOfficeRequired"
          class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none"
        >
          <option :disabled="isOfficeRequired" value="">
            {{ isOfficeRequired ? "Select Office" : "No Office" }}
          </option>
          <option
            v-for="office in offices"
            :key="office.id"
            :value="office.id"
            class="capitalize"
          >
            {{ office.office_name }}
          </option>
        </select>
        <p v-if="!isOfficeRequired" class="mt-1 text-xs text-slate-500">
          Office is optional for admin and staff accounts.
        </p>
      </div>
    </div>

    <!-- SUBMIT -->
    <div class="flex items-center gap-3">
      <button
        type="submit"
        :disabled="loading"
        class="rounded-2xl bg-red-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ loading ? "Creating..." : "Create Account" }}
      </button>

      <span v-if="successMessage" class="text-sm text-emerald-800">
        {{ successMessage }}
      </span>
    </div>

    <p v-if="error" class="text-sm text-red-800">{{ error }}</p>
  </form>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useUserStore } from "../store/user.js";
import { useOfficeStore } from "../store/office.js";

const userStore = useUserStore();
const officeStore = useOfficeStore();
const emit = defineEmits(["created"]);

const fullname = ref("");
const username = ref("");
const password = ref("");
const roleId = ref("");
const officeId = ref("");

const roles = computed(() => userStore.roles);
const offices = computed(() => officeStore.offices);

const error = ref("");
const successMessage = ref("");
const loading = ref(false);

const isOfficeRequired = computed(() => Number(roleId.value) === 3);

watch(roleId, (newRoleId) => {
  if (Number(newRoleId) !== 3) {
    officeId.value = "";
  }
});

/* SUBMIT FORM */
async function submitForm() {
  error.value = "";
  successMessage.value = "";
  loading.value = true;

  try {
    const createdUser = await userStore.createAccount({
      fullname: fullname.value,
      username: username.value,
      password: password.value,
      role_id: roleId.value,
      office_id: isOfficeRequired.value ? officeId.value : null,
    });

    successMessage.value = "Account created successfully.";

    fullname.value = "";
    username.value = "";
    password.value = "";
    roleId.value = "";
    officeId.value = "";

    emit("created", createdUser);
  } catch (submissionError) {
    error.value = submissionError.message || "Unable to create account.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  userStore.fetchRoles();
  officeStore.fetchOffices();
});
</script>
