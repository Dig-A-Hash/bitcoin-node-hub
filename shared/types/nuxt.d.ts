declare module 'nuxt/schema' {
  interface RuntimeConfig {
    bitcoinNodeCredentials: BitcoinNodeCredential[];
    adminPasswordHash: string;
  }

  interface PublicRuntimeConfig {
    authEnabled: boolean;
  }
}
export { };
