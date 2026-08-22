import { describe, it, expect } from 'vitest'
import { stripHtml } from '../sanitize.js'

describe('stripHtml (XSS sanitization)', () => {
  it('strips script tags but keeps inner text', () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")')
  })

  it('strips nested and mixed tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
    expect(stripHtml('<img src=x onerror=alert(1)>')).toBe('')
  })

  it('strips event-handler vectors', () => {
    expect(stripHtml('<svg onload=alert(1)>hi</svg>')).toBe('hi')
  })

  it('preserves "<3" and math "a<b" (not tags)', () => {
    expect(stripHtml('I <3 cats a<b')).toBe('I <3 cats a<b')
  })

  it('passes through non-strings unchanged', () => {
    expect(stripHtml(undefined)).toBeUndefined()
    expect(stripHtml(null)).toBeNull()
    expect(stripHtml(42)).toBe(42)
  })

  it('trims whitespace', () => {
    expect(stripHtml('  hi  ')).toBe('hi')
  })
})
