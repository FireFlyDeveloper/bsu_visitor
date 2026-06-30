<template>
  <div class="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <div class="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <!-- Left: form -->
      <div class="flex items-center justify-center px-6 py-12 sm:px-10">
        <div class="w-full max-w-sm">
          <!-- Brand -->
          <div class="mb-12 flex items-center gap-3">
            <span
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-sm"
            >
              <svg
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              >
                <path d="M4 7h16M12 7v13M7 20h10" />
              </svg>
            </span>
            <div>
              <p class="font-display text-lg font-bold tracking-tight">
                BSU Visitor
              </p>
              <p class="text-xs text-[var(--ink-3)]">
                Batangas State University
              </p>
            </div>
          </div>

          <p class="eyebrow">Sign in</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight">
            Welcome back.
          </h1>
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
              class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {{ error }}
            </div>

            <AppButton type="submit" :loading="loading" block size="lg">
              {{ loading ? "Signing in…" : "Sign in" }}
            </AppButton>
          </form>

          <div class="mt-10 border-t border-[var(--line)] pt-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">
              Demo accounts
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="d in demos"
                :key="d.username"
                class="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                @click="fillDemo(d)"
                type="button"
              >
                {{ d.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: editorial image panel -->
      <div class="relative hidden lg:block">
        <div
          class="absolute inset-0 bg-gradient-to-br from-[var(--brand)] via-[#5a1208] to-[#2a0904]"
        />
        <div
          class="absolute inset-0 opacity-30"
          style="
            background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>');
          "
        />
        <div
          class="absolute inset-0"
          style="
            background-image: url('https://picsum.photos/seed/bsu-campus/1200/1600');
            background-size: cover;
            background-position: center;
            mix-blend-mode: overlay;
            opacity: 0.35;
          "
        />
        <div class="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div></div>
          <div class="max-w-md">
            <p class="eyebrow text-amber-300/90">On the record</p>
            <p
              class="font-display mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-balance"
            >
              Every visitor, every office, every entry — accounted for.
            </p>
            <p class="mt-4 text-sm text-white/75">
              A role-based campus access system for guards, staff, and admins.
            </p>
          </div>
          <div class="flex items-center gap-6 text-xs text-white/60">
            <span>© {{ new Date().getFullYear() }} BSU</span>
            <span class="h-1 w-1 rounded-full bg-white/40"></span>
            <span>NEU Campus</span>
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
