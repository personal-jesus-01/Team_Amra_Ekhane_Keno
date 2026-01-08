/**
 * API Configuration
 *
 * Centralized API endpoints and configuration.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const apiConfig = {
  baseURL: API_BASE_URL,

  endpoints: {
    // Authentication
    auth: {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      me: '/auth/me',
      refresh: '/auth/refresh',
      googleOAuth: '/auth/oauth/google',
      resetPasswordRequest: '/auth/password/reset-request',
      resetPassword: '/auth/password/reset',
    },

    // Presentations
    presentations: {
      list: '/presentations',
      get: (id: number) => `/presentations/${id}`,
      create: '/presentations',
      fromPrompt: '/presentations/from-prompt',
      fromDocument: '/presentations/from-document',
      update: (id: number) => `/presentations/${id}`,
      delete: (id: number) => `/presentations/${id}`,
      slides: (id: number) => `/presentations/${id}/slides`,
      collaborators: (id: number) => `/presentations/${id}/collaborators`,
    },

    // Slides
    slides: {
      create: (presentationId: number) => `/presentations/${presentationId}/slides`,
      update: (presentationId: number, slideId: number) =>
        `/presentations/${presentationId}/slides/${slideId}`,
      delete: (presentationId: number, slideId: number) =>
        `/presentations/${presentationId}/slides/${slideId}`,
    },

    // AI Coach
    coach: {
      sessions: '/coach/sessions',
      getSession: (id: number) => `/coach/sessions/${id}`,
      analyze: '/coach/analyze',
      generateSpeech: '/coach/generate-speech',
      compareSpeech: '/coach/compare-speech',
    },

    // Templates
    templates: {
      list: '/templates',
      get: (id: string) => `/templates/${id}`,
    },

    // Collaboration
    collaboration: {
      addCollaborator: (presentationId: number) =>
        `/presentations/${presentationId}/collaborators`,
      updateCollaborator: (presentationId: number, collaboratorId: number) =>
        `/presentations/${presentationId}/collaborators/${collaboratorId}`,
      removeCollaborator: (presentationId: number, collaboratorId: number) =>
        `/presentations/${presentationId}/collaborators/${collaboratorId}`,
    },

    // Documents
    documents: {
      extract: '/documents/extract',
    },

    // Storage
    storage: {
      upload: '/storage/upload',
    },

    // Analytics
    analytics: {
      userStats: '/analytics/user/stats',
      presentationStats: (id: number) => `/analytics/presentation/${id}/stats`,
    },

    // Health
    health: '/health',
  },

  /**
   * Request timeouts (milliseconds)
   */
  timeouts: {
    default: 30000,      // 30 seconds
    upload: 120000,      // 2 minutes
    aiGeneration: 60000, // 1 minute
  },
}

export default apiConfig
