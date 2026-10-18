import { useState } from 'react'
import { useApi } from './api'
import { csvCell } from './csv'
import { number, reasonName, RequestState } from './components'

const emptyFilters = { year: '', department: '', store: '', city: '', reason: '', start_date: '', end_date: '' }

export default function VedaDefteri({ options, initialYear = '', initialReason = '' }) {
  const [filters, setFilters] = useState({ ...emptyFilters, year: initialYear, reason: initialReason })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const invalidDates = filters.start_date && filters.end_date && filters.start_date > filters.end_date
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '')).toString()
  const records = useApi(invalidDates ? null : `/departures?${query}`)
  const filtered = (records.data || []).filter((item) => String(item.calisan_no).includes(search.trim()))
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20))
  const visiblePage = Math.min(page, pageCount)
  const rows = filtered.slice((visiblePage - 1) * 20, visiblePage * 20)

  function changeFilter(event) {
    setFilters({ ...filters, [event.target.name]: event.target.value })
    setPage(1)
  }
  function resetFilters() { setFilters({ ...emptyFilters }); setSearch(''); setPage(1) }

  // CSV dosyasına sadece seçilmiş filtrelerin sonuçlarını alıyoruz.
  function downloadCsv() {
    const headings = ['Employee ID', 'Departure date', 'Department', 'Job title', 'Store', 'City', 'Business unit', 'Reason', 'Tenure']
    const values = filtered.map((item) => [item.calisan_no, item.ayrilma_tarihi, item.departman, item.gorev, item.magaza_no, item.sehir, item.is_birimi, reasonName(item.sebep), item.kidem])
    const csv = [headings, ...values].map((row) => row.map(csvCell).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'mercek-departure-records.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <>
    <header className="page-intro compact-intro"><span className="eyebrow">BEHIND THE RECORDS</span><h1>Departure <em>records.</em></h1><p>One period, one team, one store. Explore the records behind the departures.</p></header>
    <RequestState request={options}>
      <form className="filters" onSubmit={(event) => event.preventDefault()} aria-label="Departure record filters">
        <label>Year<select name="year" value={filters.year} onChange={changeFilter}><option value="">All years</option>{options.data?.yillar.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
        <label>Department<select name="department" value={filters.department} onChange={changeFilter}><option value="">All departments</option>{options.data?.departmanlar.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>Store<select name="store" value={filters.store} onChange={changeFilter}><option value="">All units</option>{options.data?.magazalar.map((item) => <option key={item.kod} value={item.kod}>{item.kod} · {item.sehir}</option>)}</select></label>
        <label>Departure reason<select name="reason" value={filters.reason} onChange={changeFilter}><option value="">All reasons</option>{['Retirement', 'Resignation', 'Layoff'].map((reason) => <option key={reason} value={reason}>{reasonName(reason)}</option>)}</select></label>
        <label>City<select name="city" value={filters.city} onChange={changeFilter}><option value="">All cities</option>{options.data?.sehirler?.map((city) => <option key={city}>{city}</option>)}</select></label>
        <label>Start date<input type="date" name="start_date" min="2006-01-01" max="2015-12-31" value={filters.start_date} onChange={changeFilter} /></label>
        <label>End date<input type="date" name="end_date" min="2006-01-01" max="2015-12-31" value={filters.end_date} onChange={changeFilter} /></label>
        <label className="search-field">Employee ID<input type="search" inputMode="numeric" placeholder="e.g. 3008" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label>
        <button type="button" className="text-button reset-button" onClick={resetFilters}>Clear filters ↺</button>
      </form>
    </RequestState>
    {invalidDates ? <p className="request-error" role="alert">The start date must not be after the end date.</p> : <>
      <div className="table-heading"><p aria-live="polite">{records.loading ? 'Loading records…' : records.error ? 'Unable to load records' : <><strong>{number(filtered.length)}</strong> departure records</>}</p><button className="text-button" onClick={downloadCsv} disabled={records.loading || !!records.error || !filtered.length}>Download CSV ↓</button></div>
      <RequestState request={records}>{filtered.length ? <>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Employees who left"><table>
          <caption className="sr-only">Recorded departures matching the selected filters</caption>
          <thead><tr><th scope="col">Employee ID</th><th scope="col">Departure date</th><th scope="col">Department / job title</th><th scope="col">Location</th><th scope="col">Tenure</th><th scope="col">Reason</th></tr></thead>
          <tbody>{rows.map((item) => <tr key={`${item.calisan_no}-${item.ayrilma_tarihi}`}><td className="employee-id">#{item.calisan_no}</td><td className="nowrap">{new Intl.DateTimeFormat('en-US').format(new Date(`${item.ayrilma_tarihi}T12:00:00`))}</td><td>{item.departman}<small>{item.gorev}</small></td><td>{item.sehir}<small>{item.is_birimi === 'STORES' ? `Store ${item.magaza_no}` : 'Head office'}</small></td><td className="nowrap">{item.kidem} years</td><td><span className={`reason-label ${item.sebep.toLowerCase()}`}>{reasonName(item.sebep)}</span></td></tr>)}</tbody>
        </table></div>
        <div className="pagination"><span>{number((visiblePage - 1) * 20 + 1)}–{number(Math.min(visiblePage * 20, filtered.length))} / {number(filtered.length)} records</span><div><button disabled={visiblePage === 1} onClick={() => setPage(visiblePage - 1)} aria-label="Previous page">←</button><span>{visiblePage} / {pageCount}</span><button disabled={visiblePage === pageCount} onClick={() => setPage(visiblePage + 1)} aria-label="Next page">→</button></div></div>
      </> : <div className="empty-state"><span aria-hidden="true">—</span><h2>No matching records.</h2><p>Try broader filters or a different period.</p><button className="text-button" onClick={resetFilters}>Show all records ↗</button></div>}</RequestState>
    </>}
    <p className="data-caption">Dates refer to actual departures. Selecting a store excludes head-office records. Employees are identified only by synthetic IDs.</p>
  </>
}
