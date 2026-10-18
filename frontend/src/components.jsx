export const number = (value) => new Intl.NumberFormat('en-US').format(value)
export const percent = (value) => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)}%`
export const reasonName = (value) => ({ Retirement: 'Retirement', Resignation: 'Resignation', Layoff: 'Layoff' })[value] || value

export function SectionTitle({ index, title, description, children }) {
  return <div className="section-heading"><div><span className="eyebrow section-index">{index}</span><h2>{title}</h2>{description && <p className="muted">{description}</p>}</div>{children}</div>
}

export function RequestState({ request, children }) {
  if (request.loading) return <p className="request-status" role="status"><span className="loading-dot" />Loading data…</p>
  if (request.error) return <div className="request-error" role="alert"><p>{request.error}</p><button className="text-button" onClick={request.retry}>Try again ↗</button></div>
  return children
}

export function Bars({ items, percentage = false }) {
  if (!items.length) return <p className="empty-state">No records match this selection.</p>
  const maximum = Math.max(...items.map((item) => item.value), 1)
  return <ul className="bar-list">{items.map((item, index) => (
    <li key={item.label} className={`bar-row ${item.label === 'Male' ? 'male' : ''}`}>
      <div className="bar-description"><span className="bar-order" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{item.label}</span><strong>{percentage ? percent(item.value) : number(item.value)}{!percentage && <span className="unit"> people</span>}</strong></div>
      <div className="bar-track" aria-hidden="true"><span style={{ width: `${item.value / maximum * 100}%` }} /></div>
      {item.detail && <span className="bar-detail">{item.detail}</span>}
    </li>
  ))}</ul>
}
