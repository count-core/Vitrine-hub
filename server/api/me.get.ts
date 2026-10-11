export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { collection, role } = await resolveCollection(user.id)
  const ai = resolveAiSettings(collection)
  return {
    user: { id: user.id, name: user.name, email: user.email, role },
    collection: { id: collection.id, name: collection.name, visibility: collection.visibility, slug: collection.slug, publicTitle: collection.publicTitle, publicIntro: collection.publicIntro, publicName: collection.publicName, showWanted: collection.showWanted, allowInquiries: collection.allowInquiries },
    ai: { provider: ai.provider, model: ai.model, configured: isConfigured(ai), source: ai.source },
  }
})
