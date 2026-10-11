import { asc, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

const COND: Record<string, string> = { mnh: '**', hinged: '*', no_gum: '(*)', used: 'o', unknown: '' }

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const rows = await db.query.item.findMany({ where: eq(schema.item.collectionId, c.id), orderBy: [asc(schema.item.area), asc(schema.item.michelNo)], with: { album: true } })
  const cols = ['gebiet', 'land', 'jahr', 'michel', 'nennwert', 'motiv', 'farbe', 'erhaltung', 'menge', 'status', 'album', 'blatt', 'position', 'katalogwert', 'schaetzwert', 'notiz_privat', 'notiz', 'ki_konfidenz', 'erfasst']
  const data = rows.map(r => ({
    gebiet: r.area, land: r.country, jahr: r.year, michel: r.michelNo, nennwert: r.faceValue, motiv: r.motif, farbe: r.color, erhaltung: COND[r.condition] ?? '', menge: r.quantity, status: r.status,
    album: r.album?.number ?? '', blatt: r.sheet ?? '', position: r.position ?? '', katalogwert: r.catalogValue ?? '', schaetzwert: r.estValue ?? '', notiz_privat: r.privateNote, notiz: r.publicNote,
    ki_konfidenz: r.aiConfidence ?? '', erfasst: r.createdAt.toISOString().slice(0, 10),
  }))
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="sammlung-${new Date().toISOString().slice(0, 10)}.csv"`)
  return toCsv(data, cols)
})
