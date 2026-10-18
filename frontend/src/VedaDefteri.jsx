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
    const headings = ['Çalışan no', 'Ayrılma tarihi', 'Departman', 'Görev', 'Mağaza', 'Şehir', 'İş birimi', 'Sebep', 'Kıdem']
    const values = filtered.map((item) => [item.calisan_no, item.ayrilma_tarihi, item.departman, item.gorev, item.magaza_no, item.sehir, item.is_birimi, reasonName(item.sebep), item.kidem])
    const csv = [headings, ...values].map((row) => row.map(csvCell).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'mercek-ayrilma-kayitlari.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <>
    <header className="page-intro compact-intro"><span className="eyebrow">KAYITLARIN İZİNDE</span><h1>Veda <em>defteri.</em></h1><p>Bir dönem, bir ekip, bir mağaza. Geçmiş ayrılma kayıtlarına yakından bak.</p></header>
    <RequestState request={options}>
      <form className="filters" onSubmit={(event) => event.preventDefault()} aria-label="Ayrılma kaydı filtreleri">
        <label>Yıl<select name="year" value={filters.year} onChange={changeFilter}><option value="">Tüm yıllar</option>{options.data?.yillar.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
        <label>Departman<select name="department" value={filters.department} onChange={changeFilter}><option value="">Tüm departmanlar</option>{options.data?.departmanlar.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>Mağaza<select name="store" value={filters.store} onChange={changeFilter}><option value="">Tüm birimler</option>{options.data?.magazalar.map((item) => <option key={item.kod} value={item.kod}>{item.kod} · {item.sehir}</option>)}</select></label>
        <label>Ayrılma sebebi<select name="reason" value={filters.reason} onChange={changeFilter}><option value="">Tüm sebepler</option>{['Retirement', 'Resignation', 'Layoff'].map((reason) => <option key={reason} value={reason}>{reasonName(reason)}</option>)}</select></label>
        <label>Şehir<select name="city" value={filters.city} onChange={changeFilter}><option value="">Tüm şehirler</option>{options.data?.sehirler?.map((city) => <option key={city}>{city}</option>)}</select></label>
        <label>Başlangıç tarihi<input type="date" name="start_date" min="2006-01-01" max="2015-12-31" value={filters.start_date} onChange={changeFilter} /></label>
        <label>Bitiş tarihi<input type="date" name="end_date" min="2006-01-01" max="2015-12-31" value={filters.end_date} onChange={changeFilter} /></label>
        <label className="search-field">Çalışan numarası<input type="search" inputMode="numeric" placeholder="Örn. 3008" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label>
        <button type="button" className="text-button reset-button" onClick={resetFilters}>Filtreleri temizle ↺</button>
      </form>
    </RequestState>
    {invalidDates ? <p className="request-error" role="alert">Başlangıç tarihi bitiş tarihinden sonra olamaz.</p> : <>
      <div className="table-heading"><p aria-live="polite">{records.loading ? 'Kayıtlar getiriliyor…' : records.error ? 'Kayıtlar yüklenemedi' : <><strong>{number(filtered.length)}</strong> ayrılma kaydı</>}</p><button className="text-button" onClick={downloadCsv} disabled={records.loading || !!records.error || !filtered.length}>CSV indir ↓</button></div>
      <RequestState request={records}>{filtered.length ? <>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Ayrılan çalışanlar tablosu"><table>
          <caption className="sr-only">Seçilen filtrelere göre gerçek ayrılma kayıtları</caption>
          <thead><tr><th scope="col">Çalışan no</th><th scope="col">Ayrılma tarihi</th><th scope="col">Departman / görev</th><th scope="col">Konum</th><th scope="col">Kıdem</th><th scope="col">Sebep</th></tr></thead>
          <tbody>{rows.map((item) => <tr key={`${item.calisan_no}-${item.ayrilma_tarihi}`}><td className="employee-id">#{item.calisan_no}</td><td className="nowrap">{new Intl.DateTimeFormat('tr-TR').format(new Date(`${item.ayrilma_tarihi}T12:00:00`))}</td><td>{item.departman}<small>{item.gorev}</small></td><td>{item.sehir}<small>{item.is_birimi === 'STORES' ? `Mağaza ${item.magaza_no}` : 'Merkez ofis'}</small></td><td className="nowrap">{item.kidem} yıl</td><td><span className={`reason-label ${item.sebep.toLowerCase()}`}>{reasonName(item.sebep)}</span></td></tr>)}</tbody>
        </table></div>
        <div className="pagination"><span>{number((visiblePage - 1) * 20 + 1)}–{number(Math.min(visiblePage * 20, filtered.length))} / {number(filtered.length)} kayıt</span><div><button disabled={visiblePage === 1} onClick={() => setPage(visiblePage - 1)} aria-label="Önceki sayfa">←</button><span>{visiblePage} / {pageCount}</span><button disabled={visiblePage === pageCount} onClick={() => setPage(visiblePage + 1)} aria-label="Sonraki sayfa">→</button></div></div>
      </> : <div className="empty-state"><span aria-hidden="true">—</span><h2>Bu seçimde kayıt yok.</h2><p>Filtreleri genişletebilir veya başka bir dönem seçebilirsin.</p><button className="text-button" onClick={resetFilters}>Tüm kayıtları göster ↗</button></div>}</RequestState>
    </>}
    <p className="data-caption">Tarihler gerçek ayrılma tarihidir. Mağaza seçildiğinde merkez ofis kayıtları dışarıda bırakılır. Çalışanlar anonim numaralarıyla gösterilir.</p>
  </>
}
