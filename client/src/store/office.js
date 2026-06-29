import { defineStore } from "pinia";

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not defined in environment variables");
}

const OFFICE_ENDPOINT = `${API_BASE}/offices`;

function handleResponse(response) {
  return response.json().then((body) => {
    if (!response.ok) {
      throw new Error(body?.error || response.statusText);
    }
    return body;
  });
}

export const useOfficeStore = defineStore("office", {
  state: () => ({
    offices: [],
    office: null,
    loading: false,
    fetchingOffices: false,
    updatingStatus: false,
    error: null,
    successMessage: "",
  }),

  actions: {
    async fetchOfficeDashboard() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`${OFFICE_ENDPOINT}/staff/dashboard`, {
          credentials: "include",
        });

        const data = await handleResponse(response);
        this.office = data;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchOffices() {
      this.fetchingOffices = true;
      this.error = null;

      try {
        const response = await fetch(OFFICE_ENDPOINT, {
          credentials: "include",
        });

        const data = await handleResponse(response);
        this.offices = data;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.fetchingOffices = false;
      }
    },

    async updateOfficeStatus(status) {
      if (!this.office || this.office.status === status) return;

      this.updatingStatus = true;
      this.error = null;
      this.successMessage = "";

      try {
        const response = await fetch(
          `${OFFICE_ENDPOINT}/${this.office.id}/status`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          },
        );

        const data = await handleResponse(response);
        this.office = data;
        this.successMessage = `Office status updated to ${status}.`;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.updatingStatus = false;
      }
    },

    async updateOffice(id, payload) {
      this.loading = true;
      this.error = null;
      this.successMessage = "";

      try {
        const response = await fetch(`${OFFICE_ENDPOINT}/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await handleResponse(response);

        const index = this.offices.findIndex((o) => o.id === id);
        if (index !== -1) {
          this.offices[index] = {
            ...this.offices[index],
            ...payload,
          };
        }

        if (this.office?.id === id) {
          this.office = data;
        }

        this.successMessage = "Office updated successfully.";

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateOfficeStatusBySecurity(status) {
      if (!this.office || this.office.status === status) return;

      this.updatingStatus = true;
      this.error = null;
      this.successMessage = "";

      try {
        const response = await fetch(
          `${API_BASE}/security-guard/office/${this.office.id}/status`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          },
        );

        const data = await handleResponse(response);

        if (data.new_status) {
          this.office.status = data.new_status;
        } else {
          this.office = data;
        }

        this.successMessage = `Office status updated to ${status}.`;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.updatingStatus = false;
      }
    },

    clearMessages() {
      this.error = null;
      this.successMessage = "";
    },
  },
});
