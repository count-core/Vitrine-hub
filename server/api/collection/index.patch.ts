import { eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const b = await readBody<Record<string, unknown>>(event)
  const patch: Record<string, unknown> = {}
  if (typeof b.name === 'string') patch.name = b.name.slice(0, 120)
  if (['private', 'link', 'public'].includes(b.visibility as string)) patch.visibility = b.visibility
  for (const k of ['publicTitle', 'publicIntro', 'publicName']) if (typeof b[k] === 'string') patch[k] = (b[k] as string).slice(0, k === 'publicIntro' ? 2000 : 160)
  for (const k of ['showWanted', 'allowInquiries']) if (typeof b[k] === 'boolean') patch[k] = b[k]
  if (typeof b.slug === 'string') {
    const slug = slugify(b.slug)
    if (slug.length < 3) throw createError({ statusCode: 400, statusMessage: 'Kurzlink braucht mindestens 3 Zeichen' })
    const taken = await db.query.collection.findFirst({ where: eq(schema.collection.slug, slug) })
    if (taken && taken.id !== c.id) throw createError({ statusCode: 409, statusMessage: 'Kurzlink ist schon vergeben' })
    patch.slug = slug
  }
  if ((patch.visibility && patch.visibility !== 'private') && !c.slug && !patch.slug) patch.slug = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  const [row] = await db.update(schema.collection).set(patch).where(eq(schema.collection.id, c.id)).returning()
  return row
})
