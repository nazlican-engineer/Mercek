import { useState } from 'react'
import { useApi } from './api'
import { Bars, number, percent, RequestState } from './components'

const groups = { department: 'Departman', city: 'Şehir', gender: 'Cinsiyet', tenure: 'Kıdem' }

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
    <header className="page-intro compact-intro"><span className="eyebrow">SAYILARIN BİR ADIM ÖTESİ</span><h1>Biraz daha <em>yakından.</em></h1><p>Ayrılma sayıları tek başına her şeyi söylemez. Grupları ve çalışan sayılarını birlikte incele.</p></header>
    <div className="comparison-controls"><div className="group-switch" role="group" aria-label="Karşılaştırma boyutu">{Object.entries(groups).map(([key, label]) => <button key={key} aria-pressed={group === key} className={group === key ? 'selected' : ''} onClick={() => { setGroup(key); setShowAll(false) }}>{label}</button>)}</div><label className="period-select">Dönem<select value={year} onChange={(event) => { setYear(event.target.value); setShowAll(false); setAllStores(false) }}><option value="">2006–2015 · Tüm dönem</option>{Array.from({ length: 10 }, (_, i) => 2006 + i).map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
    <RequestState request={request}>
      <div className="comparison-summary"><p><strong>{number(total)}</strong> çalışan arasında <strong className="accent">{number(departed)}</strong> kişi ayrıldı.</p><span>{sorted.length} grup · {total ? percent(100 * departed / total) : '%0'} ayrılma payı</span></div>
      <div className="comparison-heading"><h2>{groups[group]} karşılaştırması</h2><div className="mode-switch" role="group" aria-label="Gösterilecek ölçü"><button aria-pressed={mode === 'count'} className={mode === 'count' ? 'selected' : ''} onClick={() => setMode('count')}>Kişi sayısı</button><button aria-pressed={mode === 'rate'} className={mode === 'rate' ? 'selected' : ''} onClick={() => setMode('rate')}>Ayrılma yüzdesi</button></div></div>
      <Bars percentage={mode === 'rate'} items={(showAll ? sorted : sorted.slice(0, 10)).map((item) => ({ label: item.grup, value: mode === 'count' ? item.ayrilan_calisan : item.ayrilma_yuzdesi, detail: `${number(item.toplam_calisan)} çalışandan ${number(item.ayrilan_calisan)} kişi ayrıldı · ${percent(item.ayrilma_yuzdesi)}` }))} />
      {sorted.length > 10 && <button className="text-button show-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'İlk 10 grubu göster ↑' : `${sorted.length} grubun tümünü göster ↓`}</button>}
    </RequestState>
    <section className="store-comparison report-section" aria-label="Mağaza karşılaştırması">
      <div className="comparison-heading"><h2>Mağaza karşılaştırması</h2><div className="mode-switch" role="group" aria-label="Mağaza ölçüsü"><button aria-pressed={storeMode === 'count'} className={storeMode === 'count' ? 'selected' : ''} onClick={() => setStoreMode('count')}>Kişi sayısı</button><button aria-pressed={storeMode === 'rate'} className={storeMode === 'rate' ? 'selected' : ''} onClick={() => setStoreMode('rate')}>Ayrılma yüzdesi</button></div></div>
      <p className="data-caption">{year || '2006–2015'} · Yalnızca STORES birimi; merkez ofis dahil değildir. Yukarıdaki dönem seçimi bu grafiğe de uygulanır.</p>
      <RequestState request={stores}>
        <Bars percentage={storeMode === 'rate'} items={(allStores ? storeRows : storeRows.slice(0, 10)).map((item) => ({ label: item.grup, value: storeMode === 'count' ? item.ayrilan_calisan : item.ayrilma_yuzdesi, detail: `${number(item.toplam_calisan)} çalışandan ${number(item.ayrilan_calisan)} kişi ayrıldı · ${percent(item.ayrilma_yuzdesi)}` }))} />
        {storeRows.length > 10 && <button className="text-button show-more" onClick={() => setAllStores(!allStores)}>{allStores ? 'İlk 10 mağazayı göster ↑' : `${storeRows.length} mağazanın tümünü göster ↓`}</button>}
      </RequestState>
    </section>
    <aside className="method-note"><span className="eyebrow">NASIL OKUMALI?</span><p>{year ? `${year} yılındaki her çalışanın son kaydı kullanılır. Payda o yıl gözlenen benzersiz çalışanlardır; oran yıl başı/sonu ortalama personel üzerinden hesaplanan devir oranı değildir.` : 'Her çalışan, veri dönemindeki son kaydına göre bir kez sayılır. Kıdem de bu son kayda aittir. Yüzde, tüm dönemde ayrılanların gözlenen çalışanlara oranıdır; yıllık devir oranı değildir.'}</p><p>Küçük gruplarda birkaç ayrılma bile yüksek yüzde oluşturabilir. {group === 'store' && 'Yalnızca mağaza birimi vardır; merkez ofis dahil değildir.'} Verideki farklı şehir yazımları korunmuştur.</p></aside>
  </>
}
