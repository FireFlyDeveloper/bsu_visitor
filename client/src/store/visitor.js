import { defineStore } from 'pinia'

const API_BASE = import.meta.env.VITE_API_BASE

if (!API_BASE) {
  throw new Error('VITE_API_BASE is not defined in environment variables')
}

const VISITOR_ENDPOINT = `${API_BASE}/visitors`

function handleResponse(response) {
  return response.json().then((body) => {
    if (!response.ok) {
      throw new Error(body?.error || response.statusText)
    }
    return body
  })
}

function buildQueryString(url, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value))
    }
  })
  const queryString = query.toString()
  return queryString ? `${url}?${queryString}` : url
}

export const useVisitorStore = defineStore('visitor', {
  state: () => ({
    visitors: [],
    loading: false,
    error: null,
  }),
  getters: {
    visitorCount: (state) => state.visitors.length,
    getVisitorById: (state) => (id) =>
      state.visitors.find((visitor) => String(visitor.id) === String(id)),
  },
  actions: {
    async fetchVisitors(filters = {}) {
      this.loading = true
      this.error = null

      try {
        const url = buildQueryString(VISITOR_ENDPOINT, filters)
        const response = await fetch(url, {
          credentials: 'include',
        })
        const data = await handleResponse(response)
        this.visitors = data
        return data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getVisitor(id) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`${VISITOR_ENDPOINT}/${id}`, {
          credentials: 'include',
        })
        const data = await handleResponse(response)
        return data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async createVisitor(visitorPayload) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(VISITOR_ENDPOINT, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visitorPayload),
        })
        const data = await handleResponse(response)
        return data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateVisitor(id, visitorPayload) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`${VISITOR_ENDPOINT}/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visitorPayload),
        })
        const data = await handleResponse(response)
        return data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteVisitor(id) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`${VISITOR_ENDPOINT}/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        const data = await handleResponse(response)
        this.visitors = this.visitors.filter(
          (visitor) => String(visitor.id) !== String(id)
        )
        return data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
