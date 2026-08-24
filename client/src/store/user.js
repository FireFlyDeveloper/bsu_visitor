import { defineStore } from "pinia";
import { handleResponse } from "@/utils/response";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const useUserStore = defineStore("user", {
  state: () => ({
    currentUser: null,
    users: [],
    loading: false,
    error: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    userRole: (state) => state.currentUser?.role_id || null,
  },
  actions: {
    async fetchRoles() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE}/roles`, {
          credentials: "include",
        });
        const data = await handleResponse(response);
        this.roles = data.roles;
        return data.roles;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async login({ username, password }) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        });
        const data = await handleResponse(response);
        this.currentUser = data.user;
        // Push notifications: staff (office) and security subscribe after
        // login. Fire-and-forget — a denial must not block sign-in.
        import("@/utils/push")
          .then(({ pushSupported, subscribeStaff }) => {
            const audience =
              data.user?.role_id === 2 ? "security" : "office";
            if (pushSupported()) subscribeStaff(audience).catch(() => {});
          })
          .catch(() => {});
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE}/users/logout`, {
          method: "POST",
          credentials: "include",
        });
        await handleResponse(response);
        this.currentUser = null;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCurrentUser() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE}/users/me`, {
          credentials: "include",
        });
        const data = await handleResponse(response);
        this.currentUser = data.user;
        return data.user;
      } catch (error) {
        this.currentUser = null;
        this.error = error.message;
        // Expected when logged out (401) — not an application error.
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchAllUsers() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE}/users/all-with-activity`, {
          credentials: "include",
        });
        const data = await handleResponse(response);
        this.users = data;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createAccount({ fullname, username, password, role_id, office_id }) {
      this.loading = true;
      this.error = null;
      try {
        const normalizedOfficeId =
          office_id === "" || office_id === undefined ? null : office_id;

        const response = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fullname,
            username,
            password,
            role_id,
            office_id: normalizedOfficeId,
          }),
        });
        const data = await handleResponse(response);
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateAccount(id, { fullname, username, role_id, office_id, password }) {
      this.loading = true;
      this.error = null;
      try {
        const normalizedOfficeId =
          office_id === "" || office_id === undefined || office_id === null
            ? null
            : office_id;

        // Don't send an empty password - backend treats it as "no change".
        const payload = {
          fullname,
          username,
          role_id,
          office_id: normalizedOfficeId,
          ...(password ? { password } : {}),
        };

        const response = await fetch(`${API_BASE}/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await handleResponse(response);
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setCurrentUser(user) {
      this.currentUser = user;
    },
  },
});
