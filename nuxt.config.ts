export default defineNuxtConfig({
  runtimeConfig: {
    bitcoinNodeCredentials: process.env.NUXT_BITCOIN_NODE_CREDENTIALS,
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
    public: {
      authEnabled: !!process.env.ADMIN_PASSWORD_HASH,
    },
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
      maxAge: 60 * 60 * 24 * 30,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  devServer: {
    port: 3500,
  },
  imports: {
    dirs: ['shared/types'], // Ensure types are scanned
    presets: [
      {
        from: 'axios',
        imports: [
          {
            name: 'HttpStatusCode',
            as: 'HttpStatusCode',
          },
        ],
      },
    ],
  },
  colorMode: {
    preference: 'system', // Default to system preference (light/dark)
    fallback: 'light', // Fallback theme if system preference is not available
    classSuffix: '', // Optional: removes suffix from classes (e.g., `.dark` instead of `.dark-mode`)
  },
});
