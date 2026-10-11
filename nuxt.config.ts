import pkg from './package.json'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  modules: ['@nuxt/ui', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Vitrine-Hub',
      htmlAttrs: { lang: 'de' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#F3F3F0' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Vitrine-Hub' },
        // App-Seiten sind privat; öffentliche Seiten überschreiben das mit index,follow
        { name: 'robots', content: 'noindex,nofollow' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
  fonts: {
    families: [
      { name: 'Figtree', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Schibsted Grotesk', provider: 'google', weights: [500, 700, 800] },
      { name: 'Geist Mono', provider: 'google', weights: [500, 600] },
    ],
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    uploadDir: process.env.UPLOAD_DIR || './data/uploads',
    allowSignup: process.env.ALLOW_SIGNUP === 'true',
    ai: {
      provider: process.env.AI_PROVIDER || 'gemini',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      geminiFallbackModels: process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.5-flash-lite,gemini-3.8-flash',
      grounding: process.env.GEMINI_GROUNDING === 'true',
      ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'gemma3:4b',
    },
    public: {
      allowSignup: process.env.ALLOW_SIGNUP === 'true',
      appName: process.env.APP_NAME || 'Vitrine-Hub',
      repoUrl: process.env.REPO_URL || '',
      version: pkg.version,
      legal: {
        name: process.env.LEGAL_NAME || '',
        address: process.env.LEGAL_ADDRESS || '',
        email: process.env.LEGAL_EMAIL || '',
        phone: process.env.LEGAL_PHONE || '',
        vatId: process.env.LEGAL_VAT_ID || '',
      },
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: false,
    workbox: {
      navigateFallback: '/erfassen',
      navigateFallbackDenylist: [/^\/api\//, /^\/s\//],
      globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      runtimeCaching: [
        { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//, handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } } },
        { urlPattern: /\/api\/files\//, handler: 'CacheFirst', options: { cacheName: 'images', expiration: { maxEntries: 500, maxAgeSeconds: 2592000 } } },
        { urlPattern: /\/api\/(me|stats|items)/, handler: 'NetworkFirst', options: { cacheName: 'api', networkTimeoutSeconds: 4 } },
      ],
    },
    client: { installPrompt: false },
    devOptions: { enabled: false },
  },
  nitro: {
    experimental: { tasks: false },
  },
})
