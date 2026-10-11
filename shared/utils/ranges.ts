/** Fasst fortlaufende Zahlen zu Bereichen zusammen: [3,4,5,9] -> "3–5, 9". */
export function formatRanges(nums: number[]): string {
  if (!nums?.length) return ''
  const s = [...nums].sort((a, b) => a - b)
  const parts: string[] = []
  let start = s[0]!, prev = s[0]!
  for (let i = 1; i <= s.length; i++) {
    const n = s[i]
    if (n === prev + 1) { prev = n; continue }
    parts.push(start === prev ? String(start) : `${start}–${prev}`)
    if (n == null) break
    start = prev = n
  }
  return parts.join(', ')
}
