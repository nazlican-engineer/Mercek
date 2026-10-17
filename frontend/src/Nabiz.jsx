import { useState } from 'react'
import { useApi } from './api'
import AnnualChart from './AnnualChart'
import { ReasonDonut, StackedYears, TenureChart } from './DashboardCharts'
import { number, percent, RequestState, SectionTitle } from './components'

export default function Nabiz({ summary, openRecords }) {
  const [year, setYear] = useState('')
  const years = useApi('/by-year')
  const departures = useApi('/departures')
  const allRecords = departures.data || []
  const records = allRecords.filter((row) => !year || row.ayrilma_tarihi.startsWith(year))
  const period = year || '2006–2015'
  const totals = year ? (years.data || []).find((item) => String(item.yil) === year) : summary.data

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
      <section className="dashboard-panel"><SectionTitle index={`04 / KIDEM · ${period}`} title="Kaç yılın ardından?" description="Ayrılan çalışanların şirkette çalışma süresi." /><RequestState request={departures}>{records.length ? <TenureChart records={records} /> : <p className="empty-state">Bu dönem için ayrılma kaydı yok.</p>}</RequestState><div className="dashboard-note"><span className="eyebrow">OKUMA NOTU</span><p>Bu grafikler geçmişte kaydedilen ayrılmaları anlatır. Sebepler 3 kayıtlı kategoriden oluşur; çalışanlar hakkında bir tahmin üretilmez.</p></div></section>
    </div>
  </>
}
