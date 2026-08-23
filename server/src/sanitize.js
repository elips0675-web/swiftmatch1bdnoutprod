// Этап 34+: защита от хранение-и-рендер пользовательского HTML.
// React на клиенте экранирует текст сам, но хранить теги в БД не хотим:
// чистим ввод на сервере во всех свободных текстовых полях.
// Паттерн ловит только настоящие теги (<буква…> или </…), не трогает "<3" и "a<b".

// Этап 45: усиление по итогам пробы alert("xss") в «О себе» —
// режем не только теги, но и классические векторы даже без тегов:
// содержимое <script>, inline-обработчики on*=, js/vbs-URI и вызовы-зонды alert/prompt/confirm.

const SCRIPT_BLOCK_RE = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi
const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g
const EVENT_ATTR_RE = /\bon[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/g
const JS_URI_RE = /(?:javascript|vbscript|data:text\/html)\s*:/gi
const PROBE_CALL_RE = /\b(?:alert|prompt|confirm)\s*\([^)]*\)/gi

export function stripHtml(value) {
  if (typeof value !== 'string') return value
  return value
    .replace(SCRIPT_BLOCK_RE, ' ')
    .replace(HTML_TAG_RE, '')
    .replace(EVENT_ATTR_RE, ' ')
    .replace(JS_URI_RE, '')
    .replace(PROBE_CALL_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
