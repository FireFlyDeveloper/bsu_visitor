<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <!-- Header -->
    <header>
      <p class="eyebrow text-xs font-bold uppercase tracking-widest text-[var(--bsu-red)]">Account</p>
      <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
      <p class="mt-1 text-sm text-slate-500">Your account details on this campus workspace.</p>
    </header>

    <!-- Card -->
    <section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div v-if="loading" class="space-y-4">
        <Skeleton height="72" />
        <Skeleton height="16" />
        <Skeleton height="16" />
        <Skeleton height="16" />
      </div>

      <template v-else-if="user">
        <div class="flex items-center gap-5">
          <div
            class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--bsu-red)] text-2xl font-bold text-white"
          >
            {{ initials }}
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-xl font-bold text-slate-900">{{ user.fullname }}</h2>
            <p class="text-sm font-semibold text-[var(--bsu-red)]">{{ roleLabel }}</p>
          </div>
        </div>

        <dl class="mt-8 divide-y divide-slate-100 border-t border-slate-100 text-sm">
          <div class="flex items-center justify-between gap-4 py-3.5">
            <dt class="text-slate-500">Username</dt>
            <dd class="font-mono text-xs font-semibold tabular text-slate-800">{{ user.username }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-3.5">
            <dt class="text-slate-500">Role</dt>
            <dd class="font-semibold text-slate-800">{{ roleLabel }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-3.5">
            <dt class="text-slate-500">Assigned office</dt>
            <dd class="text-right font-semibold text-slate-800">
              {{ officeName || "—" }}
            </dd>
          </div>
        </dl>
      </template>

      <EmptyState
        v-else
        icon="user"
        title="Not signed in"
        description="Sign in to view your account details."
      />

      <div class="mt-8 flex justify-end border-t border-slate-100 pt-5">
        <AppButton variant="secondary" @click="onLogout">Sign out</AppButton>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppButton from "@/components/AppButton.vue";
import Skeleton from "@/components/Skeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useUserStore } from "@/store/user";
import { roleNames } from "@/config/navigation";

const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const user = ref(null);

const initials = computed(() =>
  (user.value?.fullname || "?")
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);

const roleLabel = computed(() => {
  const u = user.value || {};
  // Prefer the friendly display name; fall back to the raw role key.
  return (
    roleNames[u.role_name || u.role] || u.role_name || u.role || "—"
  );
});

const officeName = computed(() => {
  const n = user.value?.office_name;
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
});

async function onLogout() {
  await userStore.logout?.();
  router.push("/login");
}

onMounted(async () => {
  try {
    await userStore.fetchCurrentUser();
    user.value = userStore.currentUser;
  } catch (_) {
    user.value = null;
  } finally {
    loading.value = false;
  }
});
</script>
