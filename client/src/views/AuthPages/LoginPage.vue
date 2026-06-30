<template>
  <div class="min-h-screen bg-white text-[var(--bsu-ink)]">
    <div class="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <!-- Left: form -->
      <div class="flex items-center justify-center px-6 py-12 sm:px-10">
        <div class="w-full max-w-sm">
          <!-- Brand -->
          <div class="mb-12 flex items-center gap-3">
            <img
              src="/logo/BatStateU-NEU-Logo-1-300x282.png"
              alt="BSU NEU"
              class="h-12 w-12 object-contain"
            />
            <div>
              <p class="font-display text-lg font-bold tracking-tight">
                BSU Visitor
              </p>
              <p class="text-xs text-[var(--bsu-red)]">
                Batangas State University · NEU
              </p>
            </div>
          </div>

          <p class="eyebrow">Sign in</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight">Welcome back.</h1>
          <p class="lede mt-3">
            Use your BSU credentials to access the visitor management system.
          </p>

          <form @submit.prevent="onSubmit" class="mt-10 space-y-5">
            <div>
              <label class="label" for="username">Username</label>
              <input
                id="username"
                v-model="username"
                type="text"
                autocomplete="username"
                required
                class="input"
                placeholder="e.g. admin"
              />
            </div>

            <div>
              <label class="label" for="password">Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                class="input"
                placeholder="Your password"
              />
            </div>

            <div
              v-if="error"
              class="rounded-2xl border border-[var(--bsu-red)]/30 bg-[var(--bsu-red-soft)] px-4 py-3 text-sm text-[var(--bsu-red)]"
            >
              {{ error }}
            </div>

            <AppButton type="submit" :loading="loading" block size="lg">
              {{ loading ? "Signing in…" : "Sign in" }}
            </AppButton>
          </form>

          <div class="mt-10 border-t border-[var(--bsu-line)] pt-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-[var(--bsu-ink-3)]">
              Demo accounts
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="d in demos"
                :key="d.username"
                class="rounded-full border border-[var(--bsu-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--bsu-ink-2)] transition hover:border-[var(--bsu-red)] hover:text-[var(--bsu-red)]"
                @click="fillDemo(d)"
                type="button"
              >
                {{ d.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: actual BSU campus photo with red overlay -->
      <div class="relative hidden lg:block">
        <img
          src="/img/bsu_outside.png"
          alt="BSU campus"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-gradient-to-tr from-[var(--bsu-red)]/90 via-[var(--bsu-red)]/70 to-[var(--bsu-red)]/40"
        />
        <div class="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div></div>
          <div class="max-w-md">
            <p class="eyebrow text-white/90">On the record</p>
            <p
              class="font-display mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-balance"
            >
              Every visitor, every office, every entry — accounted for.
            </p>
            <p class="mt-4 text-sm text-white/85">
              A role-based campus access system for guards, staff, and admins.
            </p>
          </div>
          <div class="flex items-center gap-4 text-xs text-white/85">
            <img
              src="/logo/BAGONG_PILIPINAS_LOGO-e1693281031955.png"
              alt="Bagong Pilipinas"
              class="h-9 w-9"
            />
            <div>
              <div>© {{ new Date().getFullYear() }} Batangas State University</div>
              <div class="font-mono tabular text-[0.6875rem] text-white/70">
                NEU Campus
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import AppButton from "@/components/AppButton.vue";

const router = useRouter();
const userStore = useUserStore();

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const demos = [
  { label: "admin", username: "admin", password: "admin123" },
  { label: "security (sec1)", username: "sec1", password: "secret123" },
  { label: "staff (staff1)", username: "staff1", password: "secret123" },
];

function fillDemo(d) {
  username.value = d.username;
  password.value = d.password;
}

async function onSubmit() {
  error.value = "";
  loading.value = true;
  try {
    await userStore.login({
      username: username.value,
      password: password.value,
    });
    router.push("/");
  } catch (err) {
    error.value =
      err?.message || "Unable to sign in. Please check your credentials.";
  } finally {
    loading.value = false;
  }
}
</script>
