<template>
  <div class="mx-auto flex max-w-sm flex-col gap-5">
    <div class="font-display flex items-center gap-2 text-3xl font-extrabold"><span class="inline-block size-5 rounded bg-orange-500" />Vitrine-Hub</div>
    <p class="text-stone-500">Anmelden zur Sammlung.</p>
    <UForm :state="form" class="flex flex-col gap-4" @submit="submit">
      <UFormField label="E-Mail" name="email"><UInput v-model="form.email" type="email" autocomplete="email" size="xl" class="w-full" /></UFormField>
      <UFormField label="Passwort" name="password"><UInput v-model="form.password" type="password" autocomplete="current-password" size="xl" class="w-full" /></UFormField>
      <UAlert v-if="error" color="error" variant="soft" :title="error" />
      <UButton type="submit" size="xl" block :loading="loading" label="Anmelden" />
    </UForm>
    <p class="text-sm text-stone-500"><NuxtLink to="/so-funktionierts" class="font-semibold underline">So funktioniert's</NuxtLink> · Noch kein Konto? <NuxtLink to="/register" class="font-semibold underline">Registrieren</NuxtLink><span v-if="!allowSignup"> (nur mit Einladungslink)</span></p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank', middleware: 'guest' })
const route = useRoute()
const allowSignup = useRuntimeConfig().public.allowSignup
const form = reactive({ email: '', password: '' })
const error = ref(''), loading = ref(false)
async function submit() {
  loading.value = true; error.value = ''
  const { error: e } = await signIn.email({ email: form.email, password: form.password })
  loading.value = false
  if (e) { error.value = e.message || 'Anmeldung fehlgeschlagen'; return }
  await navigateTo((route.query.redirect as string) || '/')
}
</script>
