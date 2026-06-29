import { defineStore } from "pinia";

const API_BASE = import.meta.env.VITE_API_BASE;
if (!API_BASE) {
  throw new Error("VITE_API_BASE is not defined in environment variables");
}

function handleResponse(response) {
  return response.json().then((body) => {
    if (!response.ok) {
      throw new Error(body?.error || response.statusText);
    }
    return body;
  });
}

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

    setCurrentUser(user) {
      this.currentUser = user;
    },
  },
});
