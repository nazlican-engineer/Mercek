import { useEffect, useRef, useState } from 'react'

const EXAMPLES = [
  'How many employees left in 2014?',
  'Show store information for employees who left in 2014',
  'List employees who resigned from the Meats department in 2015',
  'Who left store 35?',
  'List retirements in Vancouver',
  'How many employees left between January and March 2014?',
  'Compare departure counts for 2014 and 2015',
  'Show the top five departments by resignations',
  'List employees who resigned in their first two years',
  'Show the departure record for employee 3008',
  'Show departure reasons in 2014',
]

function ResultTable({ columns, rows }) {
  const [visible, setVisible] = useState(10)
  return <>
    <div className="assistant-table-scroll" tabIndex={0} role="region" aria-label="Query results"><table><caption className="sr-only">Query results from the database</caption><thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{rows.slice(0, visible).map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{value ?? '—'}</td>)}</tr>)}</tbody></table></div>
    <small>{Math.min(visible, rows.length)} / {rows.length} results shown.</small>
    {visible < rows.length && <button className="text-button" onClick={() => setVisible((value) => value + 25)}>Show 25 more results ↓</button>}
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
      setMessages((previous) => [...previous, { role: 'assistant', text: 'I cannot reach the data right now. Check the API connection and send your question again.', error: true }])
      setQuestion(text)
    } finally {
      clearTimeout(timer)
      busy.current = false
      setLoading(false)
    }
  }

  return <>
    <button ref={launcher} className="assistant-launcher" aria-label={open ? 'Close Mercek Data Assistant' : 'Open Mercek Data Assistant'} aria-expanded={open} aria-controls="assistant-panel" onClick={() => open ? close() : setOpen(true)}>
      {open ? <span aria-hidden="true">×</span> : <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" /><path d="M7 10h8M7 14h5" strokeLinecap="round" /></svg>}
    </button>
    <section id="assistant-panel" className="data-assistant assistant-panel" role="region" aria-labelledby="assistant-title" hidden={!open} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); close() } }}>

    <div className="assistant-heading"><div><span className="eyebrow">ASK YOUR DATA</span><h2 id="assistant-title">Mercek Data Assistant</h2></div><button className="assistant-close" aria-label="Close chat panel" onClick={close}>×</button></div>
    <p className="muted">Ask about departure counts, employee records, or comparisons. Add a year, city, department, or store to narrow your question.</p>
    <details className="assistant-examples"><summary>Browse example questions</summary>{EXAMPLES.map((example) => <button key={example} className="assistant-example" onClick={() => { setQuestion(example); input.current?.focus() }} disabled={loading}>{example} ↙</button>)}</details>
    <div ref={conversation} className="assistant-conversation" role="log" aria-label="Data assistant conversation" aria-live="polite" aria-relevant="additions text">
      {messages.map((message, index) => <div key={index} className={`assistant-message ${message.role}`}><span className="eyebrow">{message.role === 'user' ? 'YOU' : 'MERCEK'}</span><p>{message.text}</p>{message.filters && <p className="assistant-filters">Filters: {message.filters.join(" · ")}</p>}{message.columns && message.rows && <ResultTable columns={message.columns} rows={message.rows} />}{message.source && <small>{message.source}</small>}{message.year && <button className="text-button" onClick={() => { openRecords(String(message.year)); close() }}>Open {message.year} records ↗</button>}</div>)}
      {loading && <p className="muted" role="status">Checking the database…</p>}
    </div>
    <form className="assistant-form" onSubmit={ask}><label htmlFor="assistant-question">Your question</label><div><input ref={input} id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: How many employees left in 2015?" maxLength={300} required disabled={loading} /><button type="submit" disabled={loading || !question.trim()}>{loading ? 'Working…' : 'Ask ↗'}</button></div></form>
    <p className="data-caption">Answers are calculated from recorded data. Supported question patterns accept alternative wording; unclear questions receive a clarification request.</p>
  </section>
  </>
}
