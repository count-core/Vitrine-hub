export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const body = await readBody<{ number: number, name?: string }>(event)
  if (!body?.number) throw createError({ statusCode: 400, statusMessage: 'Nummer fehlt' })
  return getOrCreateAlbum(c.id, Number(body.number), body.name)
})
