// https://nuxt.com/docs/api/configuration/nuxt-config
import { type BitcoinNodeCredential } from './server/utils/bitcoinCoreTypes';

// Extend NitroRuntimeConfig to include bitcoinNodeCredentials
interface CustomNitroRuntimeConfig {
  bitcoinNodeCredentials: BitcoinNodeCredential[];
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui', '@nuxtjs/color-mode'],
  css: ['~/assets/css/main.css'],
  devServer: {
    port: 3500,
  },
  colorMode: {
    preference: 'system', // Default to system preference (light/dark)
    fallback: 'light', // Fallback theme if system preference is not available
    classSuffix: '', // Optional: removes suffix from classes (e.g., `.dark` instead of `.dark-mode`)
  },
  nitro: {
    preset: 'node-server',
  },
});
