<template>
  <p class="text-sm text-slate-600">
    Update details for <span class="font-semibold text-slate-800">{{ initialUser.fullname }}</span>.
  </p>

  <form @submit.prevent="submitForm" class="mt-5 space-y-4">
    <!-- FULL NAME -->
    <div>
      <label for="edit-fullname" class="block text-sm font-medium text-slate-700">Full name</label>
      <input
        id="edit-fullname"
        v-model="fullname"
        type="text"
        required
        autocomplete="name"
        class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-red-500 focus:outline-none"
      />
    </div>

    <!-- USERNAME -->
    <div>
      <label for="edit-username" class="block text-sm font-medium text-slate-700">Username</label>
      <input
        id="edit-username"
        v-model="username"
        type="text"
        required
        autocomplete="username"
        class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 focus:border-red-500 focus:outline-none"
      />
    </div>

    <!-- PASSWORD (optional reset) -->
    <div>
      <label for="edit-password" class="block text-sm font-medium text-slate-700">
        New password
      </label>
      <input
        id="edit-password"
        v-model="password"
        type="password"
        minlength="6"
        autocomplete="new-password"
        placeholder="Leave blank to keep current password"
        class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none"
      />
      <p class="mt-1 text-xs text-slate-500">
        Optional. Minimum 6 characters if provided.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <!-- ROLE -->
      <div>
        <label for="edit-role" class="block text-sm font-medium text-slate-700">Role</label>
        <select
          id="edit-role"
          v-model="roleId"
          required
          :disabled="isSelf"
          class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-red-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option disabled value="">Select role</option>
          <option v-for="role in roles" :key="role.id" :value="role.id">
            {{ role.role_name }}
          </option>
        </select>
        <p v-if="isSelf" class="mt-1 text-xs text-amber-700">
          You cannot change your own role.
        </p>
      </div>

      <!-- OFFICE -->
      <div>
        <label for="edit-office" class="block text-sm font-medium text-slate-700">Office</label>
        <select
          id="edit-office"
          v-model="officeId"
          :required="isOfficeRequired"
          class="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-red-500 focus:outline-none"
        >
          <option :disabled="isOfficeRequired" value="">
            {{ isOfficeRequired ? "Select office" : "No office" }}
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
          Office is optional for admin and security accounts.
        </p>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        :disabled="loading"
        class="rounded-2xl bg-red-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ loading ? "Saving..." : "Save changes" }}
      </button>
      <button
        type="button"
        @click="emit('cancel')"
        class="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Cancel
      </button>
      <span v-if="successMessage" class="text-sm text-emerald-700">
        {{ successMessage }}
      </span>
    </div>

    <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
  </form>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useUserStore } from "../store/user.js";
import { useOfficeStore } from "../store/office.js";

const props = defineProps({
  user: { type: Object, required: true },
  currentUserId: { type: Number, default: null },
});

const emit = defineEmits(["updated", "cancel"]);

const userStore = useUserStore();
const officeStore = useOfficeStore();

const initialUser = computed(() => props.user);
const isSelf = computed(() => props.currentUserId === props.user.id);

const fullname = ref(initialUser.value.fullname || "");
const username = ref(initialUser.value.username || "");
const password = ref("");
const roleId = ref(initialUser.value.role_id ?? "");
const officeId = ref(initialUser.value.office_id ?? "");

const roles = computed(() => userStore.roles);
const offices = computed(() => officeStore.offices);

const isOfficeRequired = computed(() => Number(roleId.value) === 3);

const error = ref("");
const successMessage = ref("");
const loading = ref(false);

// If the user being edited is later changed in the parent, reset the form.
watch(
  () => props.user?.id,
  () => {
    fullname.value = props.user.fullname || "";
    username.value = props.user.username || "";
    password.value = "";
    roleId.value = props.user.role_id ?? "";
    officeId.value = props.user.office_id ?? "";
    error.value = "";
    successMessage.value = "";
  },
);

// When role flips away from staff, clear the office.
watch(roleId, (next) => {
  if (Number(next) !== 3) officeId.value = "";
});

async function submitForm() {
  error.value = "";
  successMessage.value = "";
  loading.value = true;

  try {
    await userStore.updateAccount(props.user.id, {
      fullname: fullname.value,
      username: username.value,
      role_id: roleId.value,
      office_id: isOfficeRequired.value ? officeId.value : null,
      password: password.value,
    });

    successMessage.value = "Account updated successfully.";
    password.value = "";
    emit("updated", {
      id: props.user.id,
      fullname: fullname.value,
      username: username.value,
      role_id: Number(roleId.value),
      office_id: isOfficeRequired.value ? Number(officeId.value) : null,
    });
  } catch (submissionError) {
    error.value = submissionError.message || "Unable to update account.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!userStore.roles?.length) userStore.fetchRoles();
  if (!officeStore.offices?.length) officeStore.fetchOffices();
});
</script>
