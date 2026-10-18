import { useState } from 'react'
import { useApi } from './api'
import { Bars, number, percent, RequestState } from './components'

const groups = { department: 'Department', city: 'City', gender: 'Gender', tenure: 'Tenure' }

export default function Mercek() {
  const [group, setGroup] = useState('department')
  const [year, setYear] = useState('')
  const [mode, setMode] = useState('count')
  const [showAll, setShowAll] = useState(false)
  const [storeMode, setStoreMode] = useState('count')
  const [allStores, setAllStores] = useState(false)
  const stores = useApi(`/breakdown?group_by=store${year ? `&year=${year}` : ''}`)
  const storeRows = [...(stores.data || [])].sort((a, b) => storeMode === 'count' ? b.ayrilan_calisan - a.ayrilan_calisan : b.ayrilma_yuzdesi - a.ayrilma_yuzdesi)
  const request = useApi(`/breakdown?group_by=${group}${year ? `&year=${year}` : ''}`)
  const sorted = [...(request.data || [])].sort((a, b) => mode === 'count' ? b.ayrilan_calisan - a.ayrilan_calisan : b.ayrilma_yuzdesi - a.ayrilma_yuzdesi)
  const total = sorted.reduce((sum, item) => sum + item.toplam_calisan, 0)
  const departed = sorted.reduce((sum, item) => sum + item.ayrilan_calisan, 0)
  return <>
    <header className="page-intro compact-intro"><span className="eyebrow">BEYOND THE TOTALS</span><h1>A little <em>closer.</em></h1><p>Departure counts tell only part of the story. Explore groups alongside their employee populations.</p></header>
    <div className="comparison-controls"><div className="group-switch" role="group" aria-label="Comparison dimension">{Object.entries(groups).map(([key, label]) => <button key={key} aria-pressed={group === key} className={group === key ? 'selected' : ''} onClick={() => { setGroup(key); setShowAll(false) }}>{label}</button>)}</div><label className="period-select">Period<select value={year} onChange={(event) => { setYear(event.target.value); setShowAll(false); setAllStores(false) }}><option value="">2006–2015 · Full period</option>{Array.from({ length: 10 }, (_, i) => 2006 + i).map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
    <RequestState request={request}>
      <div className="comparison-summary"><p><strong>{number(total)}</strong> employees observed; <strong className="accent">{number(departed)}</strong> left.</p><span>{sorted.length} groups · {total ? percent(100 * departed / total) : '0%'} departure share</span></div>
      <div className="comparison-heading"><h2>{groups[group]} comparison</h2><div className="mode-switch" role="group" aria-label="Display measure"><button aria-pressed={mode === 'count'} className={mode === 'count' ? 'selected' : ''} onClick={() => setMode('count')}>Departure count</button><button aria-pressed={mode === 'rate'} className={mode === 'rate' ? 'selected' : ''} onClick={() => setMode('rate')}>Departure share</button></div></div>
      <Bars percentage={mode === 'rate'} items={(showAll ? sorted : sorted.slice(0, 10)).map((item) => ({ label: item.grup, value: mode === 'count' ? item.ayrilan_calisan : item.ayrilma_yuzdesi, detail: `${number(item.toplam_calisan)} employees; ${number(item.ayrilan_calisan)} left · ${percent(item.ayrilma_yuzdesi)}` }))} />
      {sorted.length > 10 && <button className="text-button show-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show the top 10 groups ↑' : `${sorted.length} groups: show all ↓`}</button>}
    </RequestState>
    <section className="store-comparison report-section" aria-label="Store comparison">
      <div className="comparison-heading"><h2>Store comparison</h2><div className="mode-switch" role="group" aria-label="Store measure"><button aria-pressed={storeMode === 'count'} className={storeMode === 'count' ? 'selected' : ''} onClick={() => setStoreMode('count')}>Departure count</button><button aria-pressed={storeMode === 'rate'} className={storeMode === 'rate' ? 'selected' : ''} onClick={() => setStoreMode('rate')}>Departure share</button></div></div>
      <p className="data-caption">{year || '2006–2015'} · STORES only; head office is excluded. The period selected above also applies to this chart.</p>
      <RequestState request={stores}>
        <Bars percentage={storeMode === 'rate'} items={(allStores ? storeRows : storeRows.slice(0, 10)).map((item) => ({ label: item.grup, value: storeMode === 'count' ? item.ayrilan_calisan : item.ayrilma_yuzdesi, detail: `${number(item.toplam_calisan)} employees; ${number(item.ayrilan_calisan)} left · ${percent(item.ayrilma_yuzdesi)}` }))} />
        {storeRows.length > 10 && <button className="text-button show-more" onClick={() => setAllStores(!allStores)}>{allStores ? 'Show the top 10 stores ↑' : `${storeRows.length} stores: show all ↓`}</button>}
      </RequestState>
    </section>
    <aside className="method-note"><span className="eyebrow">HOW TO READ THIS</span><p>{year ? `${year} uses each employee’s latest record within the year. The denominator is unique employees observed that year, not average opening and closing headcount.` : 'Each employee is counted once using their latest record in the period. Tenure comes from that record. The percentage is departures divided by observed employees across the period, not an annual turnover rate.'}</p><p>A few departures can produce a high percentage in small groups. {group === 'store' && 'Only the store business unit is included; head office is excluded.'} Different city spellings in the source have been retained.</p></aside>
  </>
}
