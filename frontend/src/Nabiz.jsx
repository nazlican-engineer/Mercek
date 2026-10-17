import { useState } from 'react'
import { useApi } from './api'
import AnnualChart from './AnnualChart'
import { ReasonDonut, StackedYears, TenureChart } from './DashboardCharts'
import { Bars, number, percent, RequestState, SectionTitle } from './components'

export default function Nabiz({ summary, openRecords }) {
  const [year, setYear] = useState('')
  const [departmentMode, setDepartmentMode] = useState('count')
  const years = useApi('/by-year')
  const departures = useApi('/departures')
  const departments = useApi(`/breakdown?group_by=department${year ? `&year=${year}` : ''}`)
  const allRecords = departures.data || []
  const records = allRecords.filter((row) => !year || row.ayrilma_tarihi.startsWith(year))
  const period = year || '2006–2015'
  const totals = year ? (years.data || []).find((item) => String(item.yil) === year) : summary.data
  const stores = new Map()
  records.filter((row) => row.is_birimi === 'STORES').forEach((row) => {
    const label = `Mağaza ${row.magaza_no} · ${row.sehir}`
    stores.set(label, (stores.get(label) || 0) + 1)
  })
  const storeItems = [...stores].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'tr')).slice(0, 10)
  const departmentItems = [...(departments.data || [])].sort((a, b) => (departmentMode === 'rate' ? b.ayrilma_yuzdesi - a.ayrilma_yuzdesi : b.ayrilan_calisan - a.ayrilan_calisan) || a.grup.localeCompare(b.grup, 'tr')).slice(0, 6)

  return <>
    <header className="page-intro overview-intro dashboard-intro">
      <div><div className="eyebrow"><span className="small-line" /> İNSAN KAYNAKLARINA BİR BAKIŞ</div><h1>Veriye yakından.<br /><em>İnsanlara bir bütün olarak.</em></h1><p>Yıllar, ekipler ve ayrılma sebepleri. Geçmiş kayıtları aynı panoda keşfet.</p></div>
      <button className="text-button" onClick={() => openRecords(year)}>Kayıtları incele ↗</button>
    </header>
    <div className="dashboard-filter"><div><span className="eyebrow">ANALİZ PANOSU</span><p>{period} dönemi <span>· Gerçekleşen ayrılmalar</span></p></div><label className="period-select">Analiz dönemi<select value={year} onChange={(event) => setYear(event.target.value)}><option value="">Tüm yıllar · 2006–2015</option>{Array.from({ length: 10 }, (_, index) => 2006 + index).map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
    <RequestState request={year ? years : summary}>{totals && <dl className="headline-numbers">
      <div><dt>{year ? 'Yıl içinde gözlenen çalışan' : 'Dönem boyunca çalışan'}</dt><dd>{number(totals.toplam_calisan)}</dd><span>Benzersiz çalışan</span></div>
      <div><dt>Ayrılan çalışan</dt><dd className="accent">{number(totals.ayrilan_calisan)}</dd><span>{period} döneminde</span></div>
      <div><dt>Ayrılma payı</dt><dd>{percent(totals.ayrilma_yuzdesi)}</dd><span>Ayrılan / gözlenen çalışan</span></div>
    </dl>}</RequestState>
    <p className="data-caption">Pay, seçilen dönemde gözlenen benzersiz çalışanlara göredir; ortalama personelle hesaplanan devir oranı değildir. Ayrılma kaydı olmayanların bugün çalıştığı sonucu çıkarılamaz.</p>
    <div className="dashboard-grid">
      <section className="dashboard-panel dashboard-wide"><SectionTitle index="01 / YILLIK EĞİLİM" title="Ayrılmanın zaman içindeki izi." description="Bağlamı korumak için bu grafik her zaman on yılın tamamını gösterir." /><RequestState request={years}><AnnualChart items={years.data || []} openRecords={openRecords} /></RequestState></section>
      <section className="dashboard-panel dashboard-wide"><SectionTitle index="02 / YIL VE SEBEP" title="Her yılın ayrılma hikâyesi." description="Sütun yüksekliği toplam ayrılmayı, renkler kayıtlı sebepleri gösterir. Seçili yıl vurgulanır." /><RequestState request={departures}><StackedYears records={allRecords} years={Array.from({ length: 10 }, (_, index) => 2006 + index)} selectedYear={year} onSelect={setYear} /></RequestState></section>
      <section className="dashboard-panel"><SectionTitle index={`03 / SEBEPLER · ${period}`} title="Neden ayrıldılar?" description="Yüzdeler, seçilen dönemde ayrılan çalışanlar içindeki paydır." /><RequestState request={departures}><ReasonDonut records={records} openRecords={openRecords} year={year} /></RequestState></section>
      <section className="dashboard-panel"><SectionTitle index={`04 / EKİPLER · ${period}`} title="Hangi departmanlarda?" description="Seçilen ölçüye göre ilk altı departman." /><div className="mode-switch department-mode" role="group" aria-label="Departman grafik ölçüsü">{[['count', 'Ayrılan kişi'], ['rate', 'Ayrılma payı (%)']].map(([value, label]) => <button key={value} aria-pressed={departmentMode === value} className={departmentMode === value ? 'selected' : ''} onClick={() => setDepartmentMode(value)}>{label}</button>)}</div><RequestState request={departments}><Bars percentage={departmentMode === 'rate'} items={departmentItems.map((item) => ({ label: item.grup, value: departmentMode === 'rate' ? item.ayrilma_yuzdesi : item.ayrilan_calisan, detail: `${number(item.ayrilan_calisan)} ayrılan / ${number(item.toplam_calisan)} çalışan` }))} /></RequestState><p className="data-caption">Her çalışan dönemin son gözlemiyle bir kez gruplandırılır. Küçük ekiplerde yüksek yüzdeler görülebilir.</p><a className="text-button" href="#mercek">Tüm departmanları karşılaştır ↗</a></section>
      <section className="dashboard-panel"><SectionTitle index={`05 / MAĞAZALAR · ${period}`} title="En çok ayrılma görülen 10 mağaza." description="Yalnızca STORES birimi; merkez ofis kayıtları dahil değil." /><RequestState request={departures}><Bars items={storeItems} /></RequestState><p className="data-caption">Sayılar mağaza büyüklüğüne göre düzeltilmemiştir. Mağaza numarası ve kaydedilmiş şehir birlikte gösterilir.</p></section>
      <section className="dashboard-panel"><SectionTitle index={`06 / KIDEM · ${period}`} title="Kaç yılın ardından?" description="Ayrılan çalışanların şirkette çalışma süresi." /><RequestState request={departures}>{records.length ? <TenureChart records={records} /> : <p className="empty-state">Bu dönem için ayrılma kaydı yok.</p>}</RequestState><div className="dashboard-note"><span className="eyebrow">OKUMA NOTU</span><p>Bu grafikler geçmişte kaydedilen ayrılmaları anlatır. Sebepler 3 kayıtlı kategoriden oluşur; çalışanlar hakkında bir tahmin üretilmez.</p></div></section>
    </div>
  </>
}
