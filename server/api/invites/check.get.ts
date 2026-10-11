export default defineEventHandler(async (event) => {
  const inv = await validInvite(getQuery(event).code as string)
  return inv ? { valid: true, role: inv.role, collection: inv.collection.publicTitle || inv.collection.name } : { valid: false }
})
