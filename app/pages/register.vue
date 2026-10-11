<template>
  <div class="mx-auto flex max-w-sm flex-col gap-5">
    <div class="font-display flex items-center gap-2 text-3xl font-extrabold"><span class="inline-block size-5 rounded bg-orange-500" />Vitrine-Hub</div>
    <p class="text-stone-500">Konto anlegen.</p>
    <UAlert v-if="invite?.valid" color="success" variant="soft" :title="`Einladung für „${invite.collection}“`" :description="invite.role === 'editor' ? 'Du darfst die Sammlung bearbeiten.' : 'Du darfst die Sammlung ansehen.'" />
    <UAlert v-else-if="code" color="error" variant="soft" title="Einladung ungültig oder abgelaufen" />
    <UForm :state="form" class="flex flex-col gap-4" @submit="submit">
      <UFormField label="Name" name="name"><UInput v-model="form.name" size="xl" class="w-full" /></UFormField>
      <UFormField label="E-Mail" name="email"><UInput v-model="form.email" type="email" size="xl" class="w-full" /></UFormField>
      <UFormField label="Passwort (mind. 8 Zeichen)" name="password"><UInput v-model="form.password" type="password" autocomplete="new-password" size="xl" class="w-full" /></UFormField>
      <UAlert v-if="error" color="error" variant="soft" :title="error" />
      <UButton type="submit" size="xl" block :loading="loading" label="Registrieren" />
    </UForm>
    <p class="text-sm text-stone-500">Schon ein Konto? <NuxtLink to="/login" class="font-semibold underline">Anmelden</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank', middleware: 'guest' })
const code = (useRoute().query.code as string || '').toUpperCase()
const { data: invite } = await useFetch<any>('/api/invites/check', { query: { code }, immediate: !!code })
const form = reactive({ name: '', email: '', password: '' })
const error = ref(''), loading = ref(false)
async function submit() {
  loading.value = true; error.value = ''
  const { error: e } = await signUp.email({ name: form.name, email: form.email, password: form.password, fetchOptions: { headers: code ? { 'x-invite-code': code } : {} } })
  if (e) { loading.value = false; error.value = e.message || 'Registrierung fehlgeschlagen'; return }
  if (code) { try { await $fetch('/api/invites/redeem', { method: 'POST', body: { code } }) } catch {} }
  loading.value = false
  await navigateTo('/')
}
</script>
