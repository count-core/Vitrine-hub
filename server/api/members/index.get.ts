import { eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { collection, role, user } = await requireRole(event, 'viewer')
  const owner = await db.query.user.findFirst({ where: eq(schema.user.id, collection.ownerId), columns: { id: true, name: true, email: true } })
  const members = await db.select({ id: schema.collectionMember.id, role: schema.collectionMember.role, createdAt: schema.collectionMember.createdAt, userId: schema.user.id, name: schema.user.name, email: schema.user.email })
    .from(schema.collectionMember).innerJoin(schema.user, eq(schema.user.id, schema.collectionMember.userId)).where(eq(schema.collectionMember.collectionId, collection.id))
  const invites = role === 'owner' ? await db.query.invite.findMany({ where: eq(schema.invite.collectionId, collection.id), orderBy: (i, { desc }) => [desc(i.createdAt)] }) : []
  return { me: { id: user.id, role }, owner, members, invites, signupOpen: useRuntimeConfig().allowSignup }
})
