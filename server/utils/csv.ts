/** Zellen, die Excel als Formel lesen würde (=, +, -, @, Tab, CR), bekommen ein führendes Hochkomma. */
export function csvCell(v: unknown) {
  let t = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`
  return `"${t.replace(/"/g, '""')}"`
}

export function toCsv(rows: Record<string, unknown>[], cols: string[]) {
  const esc = csvCell
  return '﻿' + [cols.join(';'), ...rows.map(r => cols.map(c => esc(r[c])).join(';'))].join('\n')
}
