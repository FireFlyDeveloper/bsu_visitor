// stores/visitorLinks.js
import { defineStore } from "pinia";

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not defined in environment variables");
}

const VISITOR_LINKS_ENDPOINT = `${API_BASE}/visitor-links`;

function handleResponse(response) {
  return response.json().then((body) => {
    if (!response.ok) {
      throw new Error(body?.error || "Something went wrong");
    }
    return body;
  });
}

export const useVisitorLinkStore = defineStore("visitorLinks", {
  state: () => ({
    links: [],
    currentLink: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchVisitorLinks() {
      this.loading = true;
      this.error = null;

      try {
        const res = await fetch(VISITOR_LINKS_ENDPOINT);
        const data = await handleResponse(res);

        this.links = data;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchByToken(token) {
      this.loading = true;
      this.error = null;

      try {
        const res = await fetch(`${VISITOR_LINKS_ENDPOINT}/${token}`);
        const data = await handleResponse(res);

        this.currentLink = data;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    clearCurrentLink() {
      this.currentLink = null;
    },
  },
});
