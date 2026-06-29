import { defineStore } from "pinia";

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not defined in environment variables");
}

const VISITOR_LOG_ENDPOINT = `${API_BASE}/visit-logs`;

function handleResponse(response) {
  return response.json().then((body) => {
    if (!response.ok) {
      throw new Error(body?.error || response.statusText);
    }
    return body;
  });
}

export const useVisitorLogStore = defineStore("visitorLog", {
  state: () => ({
    logs: [],
    total: 0,
    page: 1,
    perPage: 20,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchVisitLogs({
      visitorName = "",
      startDate = "",
      endDate = "",
      page = 1,
      perPage = 20,
    } = {}) {
      this.loading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          visitor_name: visitorName,
          start_date: startDate,
          end_date: endDate,
          page: String(page),
          per_page: String(perPage),
        });

        const response = await fetch(
          `${VISITOR_LOG_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const data = await handleResponse(response);

        this.logs = data.logs || [];
        this.total = data.total || 0;
        this.page = data.page || page;
        this.perPage = data.per_page || perPage;

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCountPerOffice() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`${VISITOR_LOG_ENDPOINT}/counts`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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

    async fetchByStatus({ status, page = 1, perPage = 20 }) {
      this.loading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          limit: String(perPage),
          offset: String((page - 1) * perPage),
        });

        const response = await fetch(
          `${API_BASE}/visitor-status/status/${status}?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const data = await handleResponse(response);

        console.log(`Fetched ${status} logs:`, data);

        this.logs = data.rows || [];
        this.total = data.total || 0;
        this.page = page;
        this.perPage = perPage;

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchPendingVisitLogs({ page = 1, perPage = 20 } = {}) {
      return this.fetchByStatus({ status: "pending", page, perPage });
    },

    async deleteLog(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`${VISITOR_LOG_ENDPOINT}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await handleResponse(response);

        this.logs = this.logs.filter((log) => log.id !== id);
        this.total = Math.max(0, this.total - 1);

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async registerVisit(formData) {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`${VISITOR_LOG_ENDPOINT}/register`, {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
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
  },
});
