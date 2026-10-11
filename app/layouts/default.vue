<template>
  <div class="min-h-dvh bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
    <div class="mx-auto flex max-w-7xl">
      <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-stone-200 bg-white p-4 md:flex dark:border-stone-800 dark:bg-stone-900">
        <NuxtLink to="/" class="font-display mb-4 flex items-center gap-2 px-2 text-lg font-extrabold">
          <span class="inline-block size-3.5 rounded-sm bg-orange-500" />Vitrine-Hub
        </NuxtLink>
        <UButton v-for="n in nav" :key="n.to" :to="n.to" :icon="n.icon" :label="n.label" variant="ghost" color="neutral" class="justify-start"
          :class="isActive(n.to) ? 'bg-stone-100 font-semibold dark:bg-stone-800' : ''" />
        <div class="mt-auto px-2 text-xs text-stone-500">
          <div v-if="me?.user" class="truncate">{{ me.user.name }}<span v-if="me.user.role !== 'owner'" class="ml-1 rounded bg-stone-100 px-1 dark:bg-stone-800">{{ me.user.role === 'editor' ? 'bearbeitet' : 'nur ansehen' }}</span></div>
          <UButton label="Abmelden" variant="link" color="neutral" size="xs" class="px-0" @click="logout" />
          <div class="mt-2 flex flex-wrap gap-x-2 text-[11px] text-stone-400"><NuxtLink to="/so-funktionierts" class="hover:underline">Hilfe</NuxtLink><NuxtLink to="/impressum" class="hover:underline">Impressum</NuxtLink><NuxtLink to="/datenschutz" class="hover:underline">Datenschutz</NuxtLink><span>v{{ version }}</span></div>
        </div>
      </aside>
      <main class="min-w-0 flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">
        <slot />
      </main>
    </div>
    <nav class="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),12px)] md:hidden">
      <div class="flex items-center gap-1 rounded-full border border-black/5 bg-white/85 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-stone-900/85">
        <NuxtLink v-for="n in nav.slice(0, 2)" :key="n.to" :to="n.to" class="flex size-12 items-center justify-center rounded-full text-stone-500" :class="isActive(n.to) ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : ''" :aria-label="n.label">
          <UIcon :name="n.icon" class="size-5" />
        </NuxtLink>
        <NuxtLink to="/erfassen" class="flex size-13 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40" aria-label="Erfassen">
          <UIcon name="i-lucide-camera" class="size-6" />
        </NuxtLink>
        <NuxtLink v-for="n in [nav[2], nav[nav.length - 1]]" :key="n.to" :to="n.to" class="flex size-12 items-center justify-center rounded-full text-stone-500" :class="isActive(n.to) ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : ''" :aria-label="n.label">
          <UIcon :name="n.icon" class="size-5" />
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: me } = useMe()
const nav = [
  { to: '/', icon: 'i-lucide-house', label: 'Start' },
  { to: '/sammlung', icon: 'i-lucide-layout-grid', label: 'Sammlung' },
  { to: '/statistik', icon: 'i-lucide-chart-bar', label: 'Statistik' },
  { to: '/alben', icon: 'i-lucide-book-open', label: 'Alben' },
  { to: '/saetze', icon: 'i-lucide-layers', label: 'Sätze' },
  { to: '/sortieren', icon: 'i-lucide-hand', label: 'Sortieren' },
  { to: '/wunschliste', icon: 'i-lucide-heart', label: 'Wunschliste' },
  { to: '/anfragen', icon: 'i-lucide-mail', label: 'Anfragen' },
  { to: '/mitglieder', icon: 'i-lucide-users', label: 'Mitglieder' },
  { to: '/einstellungen', icon: 'i-lucide-settings', label: 'Einstellungen' },
]
const version = useRuntimeConfig().public.version
const isActive = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)
async function logout() { await signOut(); clearSessionUser(); await navigateTo('/login') }
</script>
