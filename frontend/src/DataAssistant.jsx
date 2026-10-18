import { useEffect, useRef, useState } from 'react'

const EXAMPLES = [
  '2014 yılında kaç çalışan ayrıldı?',
  '2014 yılında ayrılan çalışanların mağaza bilgilerini getir',
  '2015’te Meats departmanından istifa edenleri listele',
  '35 numaralı mağazadan kimler ayrıldı?',
  'Vancouver’da emeklilik nedeniyle ayrılanlar kimler?',
  'Ocak–Mart 2014 arasında kaç kişi ayrıldı?',
  '2014 ve 2015 ayrılma sayılarını karşılaştır',
  'En çok istifa görülen beş departmanı göster',
  'İlk iki yılında istifa eden çalışanları getir',
  '3008 numaralı çalışanın ayrılma bilgisi nedir?',
  '2014 yılında ayrılma sebeplerini göster',
]

function ResultTable({ columns, rows }) {
  const [visible, setVisible] = useState(10)
  return <>
    <div className="assistant-table-scroll" tabIndex={0} role="region" aria-label="Sorgu sonuçları"><table><caption className="sr-only">Veritabanından gelen sorgu sonuçları</caption><thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{rows.slice(0, visible).map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{value ?? '—'}</td>)}</tr>)}</tbody></table></div>
    <small>{Math.min(visible, rows.length)} / {rows.length} sonuç gösteriliyor.</small>
    {visible < rows.length && <button className="text-button" onClick={() => setVisible((value) => value + 25)}>25 sonuç daha göster ↓</button>}
  </>
}

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Konuşma ortak alanda tutulduğu için sayfa değiştirince kaybolmuyor.
export default function DataAssistant({ openRecords }) {
  const [open, setOpen] = useState(false)
  const launcher = useRef(null)
  const input = useRef(null)
  const conversation = useRef(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])
  useEffect(() => {
    if (open && conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight
  }, [messages, loading, open])

  function close() {
    setOpen(false)
    launcher.current?.focus()
  }

  async function ask(event) {
    event.preventDefault()
    const text = question.trim()
    if (!text || busy.current) return
    busy.current = true
    setLoading(true)
    setQuestion('')
    setMessages((previous) => [...previous, { role: 'user', text }])
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const response = await fetch(`${API_URL}/api/assistant?${new URLSearchParams({ question: text })}`, { signal: controller.signal })
      if (!response.ok) throw new Error('Request failed')
      const data = await response.json()
      setMessages((previous) => [...previous, { role: 'assistant', text: data.answer, source: data.source, filters: data.filters, columns: data.columns, rows: data.rows, year: data.supported ? data.year : null }])
    } catch {
      setMessages((previous) => [...previous, { role: 'assistant', text: 'Verilere şu an ulaşamıyorum. API bağlantısını kontrol edip sorunu yeniden gönderebilirsin.', error: true }])
      setQuestion(text)
    } finally {
      clearTimeout(timer)
      busy.current = false
      setLoading(false)
    }
  }

  return <>
    <button ref={launcher} className="assistant-launcher" aria-label={open ? 'Mercek Veri Asistanı’nı kapat' : 'Mercek Veri Asistanı’nı aç'} aria-expanded={open} aria-controls="assistant-panel" onClick={() => open ? close() : setOpen(true)}>
      {open ? <span aria-hidden="true">×</span> : <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" /><path d="M7 10h8M7 14h5" strokeLinecap="round" /></svg>}
    </button>
    <section id="assistant-panel" className="data-assistant assistant-panel" role="region" aria-labelledby="assistant-title" hidden={!open} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); close() } }}>

    <div className="assistant-heading"><div><span className="eyebrow">VERİYE BİR SORU SOR</span><h2 id="assistant-title">Mercek Veri Asistanı</h2></div><button className="assistant-close" aria-label="Sohbet panelini kapat" onClick={close}>×</button></div>
    <p className="muted">Ayrılma sayıları, çalışan listeleri ve karşılaştırmalar sorabilirsin. Yıl, şehir, departman ve mağaza belirtmen yeterli.</p>
    <details className="assistant-examples"><summary>Örnek soruları gör</summary>{EXAMPLES.map((example) => <button key={example} className="assistant-example" onClick={() => { setQuestion(example); input.current?.focus() }} disabled={loading}>{example} ↙</button>)}</details>
    <div ref={conversation} className="assistant-conversation" role="log" aria-label="Veri asistanı konuşması" aria-live="polite" aria-relevant="additions text">
      {messages.map((message, index) => <div key={index} className={`assistant-message ${message.role}`}><span className="eyebrow">{message.role === 'user' ? 'SEN' : 'MERCEK'}</span><p>{message.text}</p>{message.filters && <p className="assistant-filters">Filtreler: {message.filters.join(" · ")}</p>}{message.columns && message.rows && <ResultTable columns={message.columns} rows={message.rows} />}{message.source && <small>{message.source}</small>}{message.year && <button className="text-button" onClick={() => { openRecords(String(message.year)); close() }}>{message.year} kayıtlarını aç ↗</button>}</div>)}
      {loading && <p className="muted" role="status">Veritabanına bakıyorum…</p>}
    </div>
    <form className="assistant-form" onSubmit={ask}><label htmlFor="assistant-question">Sorun</label><div><input ref={input} id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Örneğin: 2015’te kaç kişi ayrıldı?" maxLength={300} required disabled={loading} /><button type="submit" disabled={loading || !question.trim()}>{loading ? 'Yanıtlanıyor…' : 'Sor ↗'}</button></div></form>
    <p className="data-caption">Cevaplar kayıtlı veriden hesaplanır. Hazır soru türleri farklı yazımlarla eşleştirilir; anlaşılmayan sorularda açıklama istenir.</p>
  </section>
  </>
}
