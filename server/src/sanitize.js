// Этап 34+: защита от хранение-и-рендер пользовательского HTML.
// React на клиенте экранирует текст сам, но хранить теги в БД не хотим:
// чистим ввод на сервере во всех свободных текстовых полях.
// Паттерн ловит только настоящие теги (<буква…> или </…), не трогает "<3" и "a<b".

const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g

export function stripHtml(value) {
  if (typeof value !== 'string') return value
  return value.replace(HTML_TAG_RE, '').trim()
}
