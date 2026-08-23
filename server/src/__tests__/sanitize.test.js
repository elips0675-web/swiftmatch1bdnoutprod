// Этап 45: тесты санитизации свободного текста (проба alert("xss") в «О себе»)
import { describe, it, expect } from 'vitest'
import { stripHtml } from '../sanitize.js'

describe('stripHtml', () => {
  it('обычный текст не трогает, включая "<3" и "a<b"', () => {
    expect(stripHtml('Люблю закаты <3 и математику a<b')).toBe('Люблю закаты <3 и математику a<b')
  })

  it('удаляет HTML-теги', () => {
    expect(stripHtml('<b>Привет</b> мир')).toBe('Привет мир')
    expect(stripHtml('<img src=x onerror=alert(1)>')).toBe('')
  })

  it('удаляет <script> вместе с содержимым', () => {
    expect(stripHtml('ok<script>alert(1)</script>ok2')).toBe('ok ok2')
  })

  it('удаляет inline-обработчики on*= даже без тегов', () => {
    expect(stripHtml('onerror=alert(1) текст')).toBe('текст')
    expect(stripHtml("onmouseover='steal()' чисто")).toBe('чисто')
  })

  it('вырезает javascript:/vbscript: URI', () => {
    expect(stripHtml('javascript:void(0)')).toBe('void(0)')
    // js-URI + зонд-вызов режутся вместе
    expect(stripHtml('ссылка javascript:alert(1) тут')).toBe('ссылка тут')
  })

  it('XSS-зонд alert("xss") не сохраняется (поле «О себе»)', () => {
    const probe = 'alert("xss")'
    const stored = stripHtml(probe)
    expect(stored).toBe('')
    expect(stored.toLowerCase()).not.toContain('alert')
  })

  it('зонды prompt/confirm тоже режутся, обычные слова живут', () => {
    expect(stripHtml('prompt("hi") confirm(1)')).toBe('')
    // слово без вызова остаётся
    expect(stripHtml('alertness и подтверждение')).toBe('alertness и подтверждение')
  })
})
