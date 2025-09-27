export default defineNuxtConfig({
  runtimeConfig: {
    bitcoinNodeCredentials: process.env.NUXT_BITCOIN_NODE_CREDENTIALS,
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: [
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  devServer: {
    port: 3500,
  },
  nitro: {
    imports: {
      presets: [
        {
          from: 'zod',
          imports: [{ name: '*', as: 'z' }],
        },
      ],
    },
  },
  imports: {
    dirs: ['shared/types'], // Ensure types are scanned
    presets: [
      {
        from: 'zod',
        imports: [
          {
            name: '*',
            as: 'z',
          },
        ],
      },
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
