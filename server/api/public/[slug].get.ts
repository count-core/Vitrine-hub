export default defineEventHandler(async (event) => {
  const c = await findPublicCollection(getRouterParam(event, 'slug')!)
  if (!c) throw createError({ statusCode: 404, statusMessage: 'Sammlung nicht gefunden' })
  const [items, wanted] = await Promise.all([publicItems(c.id), c.showWanted ? publicItems(c.id, true) : Promise.resolve([])])
  return { collection: { slug: c.slug, title: c.publicTitle || c.name, intro: c.publicIntro, name: c.publicName, visibility: c.visibility, allowInquiries: c.allowInquiries }, items, wanted }
})
