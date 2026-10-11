<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-4 bg-stone-100 px-4 text-center text-stone-900 dark:bg-stone-950 dark:text-stone-100">
    <NuxtLink to="/" class="font-display flex w-fit items-center gap-2 text-xl font-extrabold"><span class="inline-block size-3.5 rounded-sm bg-orange-500" />{{ cfg.appName }}</NuxtLink>
    <p class="font-display text-7xl font-extrabold text-stone-300 dark:text-stone-700">{{ error?.statusCode || 500 }}</p>
    <h1 class="font-display text-2xl font-extrabold">{{ title }}</h1>
    <p class="max-w-md text-stone-500">{{ hint }}</p>
    <div class="flex gap-2">
      <UButton label="Zur Startseite" @click="handleError" />
      <UButton label="Zurück" color="neutral" variant="soft" @click="back" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const cfg = useRuntimeConfig().public
const code = computed(() => props.error?.statusCode || 500)
const title = computed(() => code.value === 404 ? 'Diese Seite gibt es nicht' : code.value === 403 ? 'Kein Zugriff' : 'Da ist etwas schiefgelaufen')
const hint = computed(() => code.value === 404 ? 'Vielleicht wurde die Position gelöscht oder der Link ist unvollständig.' : code.value === 403 ? 'Für diese Aktion fehlt die Berechtigung. Der Eigentümer der Sammlung kann Rollen ändern.' : 'Bitte noch einmal versuchen. Wenn es bleibt, hilft ein Blick ins Server-Log.')
useSeoMeta({ title: `${title.value} · ${cfg.appName}` })
const handleError = () => clearError({ redirect: '/' })
const back = () => { clearError(); if (import.meta.client) window.history.back() }
</script>
