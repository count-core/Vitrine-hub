export function useMe() {
  return useFetch('/api/me', { key: 'me' })
}
