export default defineNuxtConfig({
  runtimeConfig: {
    bitcoinNodeCredentials: process.env.NUXT_BITCOIN_NODE_CREDENTIALS,
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui', '@nuxtjs/color-mode', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  devServer: {
    port: 3500,
  },
  nitro: {
    logLevel: 'debug',
    timing: true,
  },
  imports: {
    dirs: ['shared/types'], // Ensure types are scanned
  },
  colorMode: {
    preference: 'system', // Default to system preference (light/dark)
    fallback: 'light', // Fallback theme if system preference is not available
    classSuffix: '', // Optional: removes suffix from classes (e.g., `.dark` instead of `.dark-mode`)
  },
});
