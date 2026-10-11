export default defineNuxtRouteMiddleware(async () => {
  const user = await fetchSessionUser()
  if (user) return navigateTo('/')
})
