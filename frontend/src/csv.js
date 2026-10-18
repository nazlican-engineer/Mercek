// Elektronik tablo programlarının metni formül olarak çalıştırmasını önlüyoruz.
export function csvCell(value) {
  let text = String(value ?? '')
  if (typeof value === 'string' && (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text
  return `"${text.replaceAll('"', '""')}"`
}
