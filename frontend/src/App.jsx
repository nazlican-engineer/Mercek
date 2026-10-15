import { useEffect, useState } from 'react'
import { useApi } from './api'
import Nabiz from './Nabiz'
import VedaDefteri from './VedaDefteri'
import Mercek from './Mercek'
import './App.css'

const pages = { nabiz: 'Nabız', 'veda-defteri': 'Veda defteri', mercek: 'Karşılaştırmalar' }
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
      <a className="skip-link" href="#icerik">İçeriğe geç</a>
      <header className="site-header">
        <a className="brand" href="#nabiz" aria-label="Mercek, ana sayfa"><span className="pitaya-logo" aria-hidden="true"><i /><i /><i /><i /><i /></span><span>Mercek<span className="brand-dot">.</span></span></a>
        <nav aria-label="Ana gezinme">{Object.entries(pages).map(([key, name]) => <a key={key} href={`#${key}`} aria-current={page === key ? 'page' : undefined} onClick={() => key === 'veda-defteri' && setRecordSelection({ year: '', reason: '' })}>{name}<span aria-hidden="true">↗</span></a>)}</nav>
        <span className="header-period">2006 <span>—</span> 2015</span>
      </header>
      <main id="icerik" className="page-content" tabIndex={-1}>
        <div className="page-meta"><span>ÇALIŞAN AYRILMA ANALİZİ</span><span className="sample-tag"><i /> Sentetik veri çalışması</span></div>
        {page === 'nabiz' && <Nabiz summary={summary} openRecords={openRecords} />}
        {page === 'veda-defteri' && <VedaDefteri key={`${recordSelection.year}-${recordSelection.reason}`} options={options} initialYear={recordSelection.year} initialReason={recordSelection.reason} />}
        {page === 'mercek' && <Mercek />}
        <details className="about-data"><summary>Bu veriler hakkında <span aria-hidden="true">+</span></summary><p>Bu uygulama, AIHR Employee Churn eğitimindeki kurgusal MFG10YearTerminationData verisini inceler. Gerçek çalışan bilgisi içermez. 2006–2015 dönemi kayıtları kullanılır; bugünkü çalışan durumunu veya gelecekteki ayrılmaları göstermez. SAP tarzı CSV tabloları ve DuckDB veri ambarı üzerine kuruludur; gerçek SAP bağlantısı yoktur.</p><a className="text-button" href="https://www.aihr.com/blog/tutorial-people-analytics-r-employee-churn/" target="_blank" rel="noreferrer">Veri kaynağını incele ↗</a></details>
      </main>
      <footer className="site-footer"><span>Mercek<span className="brand-dot">.</span></span><p>Geçmiş kayıtlardan, anlaşılır içgörülere.</p><span>Bir veri analizi projesi · 2006–2015</span></footer>
    </div>
  )
}
