<template>
  <footer class="mx-auto mt-10 flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-stone-200 pt-4 text-xs text-stone-500 dark:border-stone-800">
    <span><b class="text-stone-700 dark:text-stone-300">{{ cfg.appName }}</b> v{{ cfg.version }} · Sammlungsdatenbank für Briefmarken und Münzen</span>
    <nav class="flex flex-wrap gap-x-4 gap-y-1">
      <NuxtLink to="/so-funktionierts" class="hover:underline">So funktioniert's</NuxtLink>
      <NuxtLink to="/impressum" class="hover:underline">Impressum</NuxtLink>
      <NuxtLink to="/datenschutz" class="hover:underline">Datenschutz</NuxtLink>
      <a v-if="cfg.repoUrl" :href="cfg.repoUrl" target="_blank" rel="noopener" class="hover:underline">Quellcode</a>
    </nav>
  </footer>
</template>

<script setup lang="ts">
const cfg = useRuntimeConfig().public
</script>
