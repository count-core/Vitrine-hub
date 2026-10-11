export default defineNuxtRouteMiddleware(async (to) => {
  const user = await fetchSessionUser()
  if (!user) return navigateTo(to.path === '/' ? '/so-funktionierts' : { path: '/login', query: { redirect: to.fullPath } })
})
