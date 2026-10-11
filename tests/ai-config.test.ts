import { describe, expect, it } from 'vitest'
import { AI_PROVIDERS, aiProvider } from '../shared/utils/aiProviders'
import { extractJson } from '../server/utils/ai/client'
import { decryptSecret, encryptSecret, maskSecret } from '../server/utils/secrets'

describe('aiProviders', () => {
  it('jeder Anbieter hat Anleitung, API-Typ und Standardmodell (außer custom)', () => {
    for (const p of AI_PROVIDERS) {
      expect(p.keySteps.length).toBeGreaterThan(1)
      expect(['gemini', 'openai', 'anthropic', 'ollama']).toContain(p.api)
      if (p.id !== 'custom') expect(p.defaultModel).not.toBe('')
      if (p.needsKey) expect(p.keyUrl).toMatch(/^https:\/\//)
    }
    expect(aiProvider('gemini')?.api).toBe('gemini')
    expect(aiProvider('nope')).toBeUndefined()
  })
})

describe('extractJson', () => {
  it('nimmt reines JSON, Zäune und Prosa drumherum', () => {
    expect(extractJson('{"ok":true}')).toEqual({ ok: true })
    expect(extractJson('```json\n{"stamps":[]}\n```')).toEqual({ stamps: [] })
    expect(extractJson('Hier ist das Ergebnis: {"a":{"b":1}} Ende.')).toEqual({ a: { b: 1 } })
    expect(() => extractJson('kein json')).toThrow()
  })
})

describe('secrets', () => {
  it('verschlüsselt und entschlüsselt mit Secret, andere Secrets scheitern', () => {
    const enc = encryptSecret('sk-test-1234', 'geheim')
    expect(enc.startsWith('v1:')).toBe(true)
    expect(enc).not.toContain('sk-test')
    expect(decryptSecret(enc, 'geheim')).toBe('sk-test-1234')
    expect(() => decryptSecret(enc, 'anders')).toThrow()
    expect(encryptSecret('', 'geheim')).toBe('')
    expect(maskSecret('sk-test-1234')).toBe('••••1234')
  })
})

import { isBlockedAddress, normalizeAddress } from '../server/utils/ai/urlGuard'
describe('urlGuard', () => {
  it('sperrt Link-Local und unspezifische Adressen, erlaubt Loopback und private Netze (Ollama)', () => {
    expect(isBlockedAddress('169.254.169.254')).toBe(true)
    expect(isBlockedAddress('::ffff:169.254.1.1')).toBe(true)
    expect(isBlockedAddress('0.0.0.0')).toBe(true)
    expect(isBlockedAddress('fe80::1')).toBe(true)
    expect(isBlockedAddress('127.0.0.1')).toBe(false)
    expect(isBlockedAddress('192.168.1.20')).toBe(false)
    expect(isBlockedAddress('10.0.0.5')).toBe(false)
    expect(isBlockedAddress('::1')).toBe(false)
  })
  it('erkennt gemappte IPv4 in allen Schreibweisen', () => {
    expect(normalizeAddress('::ffff:a9fe:a9fe')).toBe('169.254.169.254')
    expect(normalizeAddress('::FFFF:169.254.169.254')).toBe('169.254.169.254')
    expect(normalizeAddress('0:0:0:0:0:ffff:a9fe:a9fe')).toBe('169.254.169.254')
    expect(normalizeAddress('::169.254.1.1')).toBe('169.254.1.1')
    expect(normalizeAddress('[fe80::1%eth0]')).toBe('fe80::1')
    expect(isBlockedAddress('::ffff:a9fe:a9fe')).toBe(true)
    expect(isBlockedAddress('::ffff:0:0')).toBe(true)
    expect(isBlockedAddress('::ffff:7f00:1')).toBe(false)
    expect(isBlockedAddress('FE80::1')).toBe(true)
    expect(isBlockedAddress('not-an-ip')).toBe(true)
  })
})

import { csvCell, toCsv } from '../server/utils/csv'
describe('csv export', () => {
  it('entschärft Formel-Zellen und maskiert Anführungszeichen', () => {
    expect(csvCell('=SUM(A1)')).toBe(`"'=SUM(A1)"`)
    expect(csvCell('+1')).toBe(`"'+1"`)
    expect(csvCell('-2 DM')).toBe(`"'-2 DM"`)
    expect(csvCell('@x')).toBe(`"'@x"`)
    expect(csvCell('Berlin "West"')).toBe(`"Berlin ""West"""`)
    expect(csvCell(null)).toBe('""')
    expect(toCsv([{ a: 1, b: '=x' }], ['a', 'b'])).toContain(`"1";"'=x"`)
  })
})
