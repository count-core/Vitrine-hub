<template>
  <div class="flex flex-col gap-4">
    <div><h1 class="flex items-center gap-2 font-display text-3xl font-extrabold">Mitglieder <InfoTip k="members.roles" /></h1><p class="text-sm text-stone-500">Wer die Sammlung sehen oder bearbeiten darf. Eigentümer verwaltet Rollen und Einladungen.</p></div>
    <section class="rounded-3xl bg-white p-4 dark:bg-stone-900">
      <div class="flex items-center gap-3 border-b border-stone-100 py-2 dark:border-stone-800"><UBadge color="primary" variant="soft">Eigentümer</UBadge><span class="text-sm"><b>{{ d?.owner?.name }}</b> · {{ d?.owner?.email }}</span></div>
      <div v-for="m in d?.members || []" :key="m.id" class="flex flex-wrap items-center gap-3 border-b border-stone-100 py-2 last:border-0 dark:border-stone-800">
        <UBadge :color="m.role === 'editor' ? 'warning' : 'neutral'" variant="soft">{{ roleLabel(m.role) }}</UBadge>
        <span class="flex-1 text-sm"><b>{{ m.name }}</b> · {{ m.email }}</span>
        <template v-if="isOwner">
          <USelect :model-value="m.role" :items="roleItems" size="xs" class="w-36" @update:model-value="setRole(m, $event)" />
          <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-x" aria-label="Entfernen" @click="remove(m)" />
        </template>
      </div>
      <p v-if="!d?.members?.length" class="py-2 text-sm text-stone-500">Noch keine weiteren Mitglieder.</p>
    </section>
    <section v-if="isOwner" class="flex flex-col gap-3 rounded-3xl bg-white p-4 dark:bg-stone-900">
      <h2 class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">Einladen <InfoTip k="members.invite" /></h2>
      <p class="text-sm text-stone-500">Erzeuge einen Einladungslink. Damit kann sich die Person registrieren, auch wenn die Registrierung sonst geschlossen ist, und ist sofort Mitglied.</p>
      <div class="flex flex-wrap gap-2">
        <USelect v-model="inv.role" :items="roleItems" class="w-40" />
        <UInput v-model="inv.label" placeholder="Für wen? (z. B. Oma)" class="w-48" />
        <UButton label="Einladungslink erzeugen" :loading="creating" @click="createInvite" />
      </div>
      <div v-for="i in d?.invites || []" :key="i.id" class="flex flex-wrap items-center gap-2 rounded-xl bg-stone-100 p-2 text-sm dark:bg-stone-800" :class="i.usedAt || new Date(i.expiresAt) < new Date() ? 'opacity-50' : ''">
        <code class="font-mono font-bold">{{ i.code }}</code><span>{{ roleLabel(i.role) }}</span><span v-if="i.label" class="text-stone-500">· {{ i.label }}</span>
        <span class="text-xs text-stone-500">{{ i.usedAt ? 'eingelöst' : `gültig bis ${new Date(i.expiresAt).toLocaleDateString('de-DE')}` }}</span>
        <span class="flex-1" />
        <UButton v-if="!i.usedAt" size="xs" color="neutral" variant="soft" icon="i-lucide-copy" label="Link kopieren" @click="copy(i.code)" />
        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-x" aria-label="Löschen" @click="delInvite(i)" />
      </div>
      <p class="text-xs text-stone-500">Registrierung ohne Einladung ist {{ d?.signupOpen ? 'derzeit offen (ALLOW_SIGNUP=true)' : 'geschlossen' }}.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const toast = useToast()
const { data: d, refresh } = await useFetch<any>('/api/members')
const isOwner = computed(() => d.value?.me?.role === 'owner')
const roleItems = [{ label: 'Nur ansehen', value: 'viewer' }, { label: 'Bearbeiten', value: 'editor' }]
const roleLabel = (r: string) => r === 'editor' ? 'Bearbeiten' : r === 'owner' ? 'Eigentümer' : 'Nur ansehen'
const inv = reactive({ role: 'viewer', label: '' }), creating = ref(false)
async function createInvite() { creating.value = true; try { await $fetch('/api/invites', { method: 'POST', body: inv }); inv.label = ''; await refresh() } finally { creating.value = false } }
async function copy(code: string) { const url = `${window.location.origin}/register?code=${code}`; try { await navigator.clipboard.writeText(url); toast.add({ title: 'Link kopiert', description: url, color: 'success' }) } catch { window.prompt('Link kopieren:', url) } }
async function delInvite(i: any) { await $fetch(`/api/invites/${i.id}`, { method: 'DELETE' }); await refresh() }
async function setRole(m: any, role: string) { await $fetch(`/api/members/${m.id}`, { method: 'PATCH', body: { role } }); await refresh() }
async function remove(m: any) { if (!window.confirm(`${m.name} entfernen?`)) return; await $fetch(`/api/members/${m.id}`, { method: 'DELETE' }); await refresh() }
</script>
