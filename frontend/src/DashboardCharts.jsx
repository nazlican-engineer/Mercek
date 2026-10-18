import { number, percent, reasonName } from './components'

const REASONS = ['Retirement', 'Resignation', 'Layoff']
const color = (index) => `var(--reason-${index})`

export function ReasonLegend() {
  return <div className="reason-legend">{REASONS.map((reason, index) => <span key={reason}><i style={{ background: color(index) }} />{reasonName(reason)}</span>)}</div>
}

// Her yılın ayrılmalarını sebeplerine göre üst üste gösteriyoruz.
export function StackedYears({ records, years, selectedYear, onSelect }) {
  const rows = years.map((year) => ({ year, values: REASONS.map((reason) => records.filter((row) => Number(row.ayrilma_tarihi.slice(0, 4)) === year && row.sebep === reason).length) }))
  const maximum = Math.max(1, ...rows.map((row) => row.values.reduce((sum, value) => sum + value, 0)))
  const ceiling = Math.ceil(maximum / 50) * 50
  return <>
    <ReasonLegend />
    <div className="stacked-scroll" tabIndex={0} role="region" aria-label="Departures by year and reason">
      <svg className="stacked-chart" viewBox="0 0 1000 310" role="img" aria-label="Stacked column chart. Details are available in the table below.">
        {[0, 1, 2, 3, 4].map((step) => <g key={step}><line x1="50" x2="980" y1={260 - step * 55} y2={260 - step * 55} className="annual-grid" /><text x="40" y={264 - step * 55} textAnchor="end" className="annual-axis">{number(ceiling * step / 4)}</text></g>)}
        {rows.map((row, index) => {
          let offset = 0
          const total = row.values.reduce((sum, value) => sum + value, 0)
          const x = 72 + index * 91
          return <g key={row.year} opacity={selectedYear && Number(selectedYear) !== row.year ? 0.4 : 1}>
            {row.values.map((value, reasonIndex) => {
              const height = value / ceiling * 220
              offset += height
              return <rect key={reasonIndex} x={x} y={260 - offset} width="43" height={height} fill={color(reasonIndex)}><title>{row.year} · {reasonName(REASONS[reasonIndex])}: {value} people</title></rect>
            })}
            <text x={x + 21.5} y={250 - total / ceiling * 220} textAnchor="middle" className="annual-value">{total}</text>
            <text x={x + 21.5} y="285" textAnchor="middle" className="annual-axis">{row.year}</text>
          </g>
        })}
      </svg>
    </div>
    <details className="chart-data"><summary>View figures and select a year</summary><div className="table-scroll"><table><caption className="sr-only">Annual departure reasons, employee counts</caption><thead><tr><th>Year</th>{REASONS.map((reason) => <th key={reason}>{reasonName(reason)}</th>)}<th>Total</th></tr></thead><tbody>{rows.map((row) => <tr key={row.year}><th scope="row"><button className="year-table-link" onClick={() => onSelect(String(row.year))}>{row.year} ↗</button></th>{row.values.map((value, index) => <td key={index}>{value}</td>)}<td>{row.values.reduce((sum, value) => sum + value, 0)}</td></tr>)}</tbody></table></div></details>
  </>
}

export function ReasonDonut({ records, openRecords, year }) {
  const counts = REASONS.map((reason) => records.filter((row) => row.sebep === reason).length)
  const total = records.length
  if (!total) return <p className="empty-state">No departures were recorded in this period.</p>
  return <div className="donut-layout">
    <svg viewBox="0 0 240 240" className="donut-chart" role="img" aria-label={`${number(total)} departures by reason; figures are listed alongside the chart.`}>
      {counts.map((count, index) => {
        const share = count / total * 100
        const start = counts.slice(0, index).reduce((sum, value) => sum + value, 0) / total * 100
        return <circle key={REASONS[index]} cx="120" cy="120" r="88" pathLength="100" fill="none" stroke={color(index)} strokeWidth="26" strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={-start} transform="rotate(-90 120 120)"><title>{reasonName(REASONS[index])}: {count} people</title></circle>
      })}
      <text x="120" y="121" textAnchor="middle" className="donut-total">{number(total)}</text><text x="120" y="144" textAnchor="middle" className="annual-axis">employees who left</text>
    </svg>
    <ul className="donut-legend">{REASONS.map((reason, index) => <li key={reason}><button onClick={() => openRecords(year, reason)}><span><i style={{ background: color(index) }} />{reasonName(reason)}</span><strong>{number(counts[index])}<small>{percent(counts[index] / total * 100)}</small></strong></button></li>)}</ul>
  </div>
}

// Kıdemi ayrılma kaydından alıyoruz; her sütun bir kıdem aralığı.
export function TenureChart({ records }) {
  const groups = [{ label: '0–2', max: 2 }, { label: '3–5', max: 5 }, { label: '6–10', max: 10 }, { label: '11–15', max: 15 }, { label: '16+', max: Infinity }]
  const counts = groups.map(() => 0)
  records.forEach((row) => { if (row.kidem !== null) counts[groups.findIndex((group) => row.kidem <= group.max)] += 1 })
  const maximum = Math.max(...counts, 1)
  return <><div className="tenure-chart" role="list" aria-label="Employee counts by tenure at departure">{groups.map((group, index) => <div className="tenure-column" role="listitem" key={group.label} aria-label={`${group.label} years: ${counts[index]} people`}><div className="tenure-track"><span style={{ height: `${counts[index] / maximum * 100}%` }}><b>{number(counts[index])}</b></span></div><span>{group.label}<small> years</small></span></div>)}</div><p className="data-caption">Tenure is the length of service recorded at departure. Columns show employee counts, not departure probabilities.</p></>
}
