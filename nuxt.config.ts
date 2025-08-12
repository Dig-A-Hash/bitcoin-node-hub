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
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devServer: {
    port: 3500,
  },
  nitro: {
    preset: 'node-server',
  },
});
