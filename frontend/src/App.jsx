import { useEffect, useState } from 'react'
import { useApi } from './api'
import Nabiz from './Nabiz'
import VedaDefteri from './VedaDefteri'
import Mercek from './Mercek'
import DataAssistant from './DataAssistant'
import './App.css'

const pages = { nabiz: 'Overview', 'veda-defteri': 'Departure Records', mercek: 'Comparisons' }
const currentPage = () => Object.hasOwn(pages, window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'nabiz'

export default function App() {
  const [page, setPage] = useState(currentPage)
  const [recordSelection, setRecordSelection] = useState({ year: '', reason: '' })
  const summary = useApi('/summary')
  const options = useApi('/filters')

  // Sayfa bağlantılarını ve tarayıcının geri/ileri düğmelerini dinliyoruz.
  useEffect(() => {
    function onHashChange() {
      if (Object.hasOwn(pages, window.location.hash.slice(1))) {
        setPage(currentPage())
        window.scrollTo(0, 0)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  useEffect(() => { document.title = `${pages[page]} · Mercek` }, [page])

  function openRecords(year, reason = '') {
    setRecordSelection({ year, reason })
    window.location.hash = 'veda-defteri'
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#icerik">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#nabiz" aria-label="Mercek, home"><span className="pitaya-logo" aria-hidden="true"><i /><i /><i /><i /><i /></span><span>Mercek<span className="brand-dot">.</span></span></a>
        <nav aria-label="Main navigation">{Object.entries(pages).map(([key, name]) => <a key={key} href={`#${key}`} aria-current={page === key ? 'page' : undefined} onClick={() => key === 'veda-defteri' && setRecordSelection({ year: '', reason: '' })}>{name}<span aria-hidden="true">↗</span></a>)}</nav>
        <span className="header-period">2006 <span>—</span> 2015</span>
      </header>
      <main id="icerik" className="page-content" tabIndex={-1}>
        <div className="page-meta"><span>EMPLOYEE DEPARTURE ANALYTICS</span><span className="sample-tag"><i /> Synthetic dataset</span></div>
        {page === 'nabiz' && <Nabiz summary={summary} openRecords={openRecords} />}
        {page === 'veda-defteri' && <VedaDefteri key={`${recordSelection.year}-${recordSelection.reason}`} options={options} initialYear={recordSelection.year} initialReason={recordSelection.reason} />}
        {page === 'mercek' && <Mercek />}
        <DataAssistant openRecords={openRecords} />
        <details className="about-data"><summary>About this dataset <span aria-hidden="true">+</span></summary><p>This application explores the synthetic MFG10YearTerminationData dataset from the AIHR Employee Churn tutorial. It contains no real employee information. Records cover 2006–2015 and do not establish current employment status or predict future departures. The workflow uses SAP-inspired CSV tables and a DuckDB warehouse, with no connection to a live SAP system.</p><a className="text-button" href="https://www.aihr.com/blog/tutorial-people-analytics-r-employee-churn/" target="_blank" rel="noreferrer">Explore the data source ↗</a></details>
      </main>
      <footer className="site-footer"><span>Mercek<span className="brand-dot">.</span></span><p>Historical records. Clear insights.</p><span>A data analytics project · 2006–2015</span></footer>
    </div>
  )
}
