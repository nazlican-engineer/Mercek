import { useId, useState } from 'react'
import { number, percent } from './components'

// Sıfırdan başlayan, okunaklı bir dikey ölçek oluşturuyoruz.
function chartScale(maximum) {
  if (maximum <= 0) return { maximum: 1, ticks: [0, 0.25, 0.5, 0.75, 1] }
  const rawStep = maximum / 4
  const power = 10 ** Math.floor(Math.log10(rawStep))
  const fraction = rawStep / power
  const step = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power
  const top = Math.ceil(maximum / step) * step
  return { maximum: top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step) }
}

export default function AnnualChart({ items, openRecords }) {
  const [mode, setMode] = useState('rate')
  const [activeYear, setActiveYear] = useState(null)
  const gradientId = `annual-fill-${useId().replaceAll(':', '')}`
  if (!items.length) return <p className="empty-state">No annual records found.</p>

  const value = (item) => mode === 'rate' ? item.ayrilma_yuzdesi : item.ayrilan_calisan
  const format = (amount) => mode === 'rate' ? percent(amount) : number(amount)
  const peak = items.reduce((best, item) => value(item) > value(best) ? item : best)
  const active = items.find((item) => item.yil === activeYear) || peak
  const scale = chartScale(Math.max(...items.map(value)))
  const left = 65, right = 935, top = 36, bottom = 272
  const points = items.map((item, index) => ({
    ...item,
    x: items.length === 1 ? (left + right) / 2 : left + index * (right - left) / (items.length - 1),
    y: bottom - value(item) / scale.maximum * (bottom - top),
  }))
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const area = `${line} L ${points.at(-1).x} ${bottom} L ${points[0].x} ${bottom} Z`
  const activePoint = points.find((point) => point.yil === active.yil)

  return (
    <div className="annual-report">
      <div className="annual-toolbar">
        <div className="chart-legend"><i />{mode === 'rate' ? 'Departure share among employees observed each year' : 'Annual departure count'}</div>
        <div className="mode-switch" role="group" aria-label="Annual chart measure">
          <button aria-pressed={mode === 'rate'} className={mode === 'rate' ? 'selected' : ''} onClick={() => setMode('rate')}>Share (%)</button>
          <button aria-pressed={mode === 'count'} className={mode === 'count' ? 'selected' : ''} onClick={() => setMode('count')}>Departures</button>
        </div>
      </div>

      <div className="annual-readout">
        <strong>{active.yil}</strong>
        <span><b>{number(active.toplam_calisan)}</b> employees</span>
        <span><b>{number(active.ayrilan_calisan)}</b> departures</span>
        <span className="accent"><b>{percent(active.ayrilma_yuzdesi)}</b> departure share</span>
      </div>

      <figure className="annual-figure">
        <figcaption className="sr-only">Annual {mode === 'rate' ? 'departure share' : 'departure count'}. Focus a point to read details, or select it to open records.</figcaption>
        <div className="annual-plot" tabIndex={0} role="region" aria-label="Annual area chart; scroll horizontally on narrow screens">
          <svg viewBox="0 0 970 320" aria-label="Annual departures, 2006–2015">
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ac)" stopOpacity="0.28" /><stop offset="100%" stopColor="var(--ac)" stopOpacity="0.025" /></linearGradient></defs>
            {scale.ticks.map((tick) => {
              const y = bottom - tick / scale.maximum * (bottom - top)
              return <g key={tick} aria-hidden="true"><line className="annual-grid" x1={left} x2={right} y1={y} y2={y} /><text className="annual-axis" x={left - 15} y={y + 4} textAnchor="end">{format(tick)}</text></g>
            })}
            <path d={area} fill={`url(#${gradientId})`} aria-hidden="true" />
            <path d={line} className="annual-line" aria-hidden="true" />
            <line x1={activePoint.x} x2={activePoint.x} y1={top} y2={bottom} className="annual-guide" aria-hidden="true" />
            {points.map((point) => (
              <g key={point.yil} className={`annual-point ${point.yil === active.yil ? 'active' : ''}`} role="button" tabIndex={0}
                aria-label={`${point.yil}: ${number(point.toplam_calisan)} employees, ${number(point.ayrilan_calisan)} departures, ${percent(point.ayrilma_yuzdesi)} departure share. Open records.`}
                onMouseEnter={() => setActiveYear(point.yil)} onFocus={() => setActiveYear(point.yil)} onClick={() => openRecords(String(point.yil))}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openRecords(String(point.yil)) } }}>
                <title>{`${point.yil} · ${number(point.toplam_calisan)} employees · ${number(point.ayrilan_calisan)} departures · ${percent(point.ayrilma_yuzdesi)}`}</title>
                <circle cx={point.x} cy={point.y} r="17" fill="transparent" />
                <circle className="annual-marker" cx={point.x} cy={point.y} r="4.5" />
                <text className="annual-value" x={point.x} y={point.y - 17} textAnchor="middle">{format(value(point))}</text>
                <text className="annual-axis annual-year" x={point.x} y={bottom + 28} textAnchor="middle">{point.yil}</text>
              </g>
            ))}
          </svg>
        </div>
      </figure>
      <div className="chart-footnote"><span>Select a point to open records. <span className="mobile-chart-hint">Scroll the chart horizontally.</span></span><span>Highest {mode === 'rate' ? 'share' : 'count'}: <strong>{peak.yil} · {format(value(peak))}{mode === 'count' ? ' people' : ''}</strong></span></div>

      <div className="annual-table-wrap table-scroll" tabIndex={0} role="region" aria-label="Annual employee and departure table">
        <table className="annual-table">
          <caption className="sr-only">Unique employees observed and departure share for each year</caption>
          <thead><tr><th scope="col">Year</th><th scope="col">Observed employees</th><th scope="col">Employees who left</th><th scope="col">Departure share</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.yil}><th scope="row"><button className="year-table-link" onClick={() => openRecords(String(item.yil))}>{item.yil} ↗</button></th><td>{number(item.toplam_calisan)}</td><td>{number(item.ayrilan_calisan)}</td><td>{percent(item.ayrilma_yuzdesi)}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="data-caption">Share = unique employees who left during the year / unique employees with any record in that year × 100. This is not a turnover rate based on average opening and closing headcount. Repeated employee records within a year are counted once.</p>
    </div>
  )
}
