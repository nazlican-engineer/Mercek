import { useApi } from './api'
import AnnualChart from './AnnualChart'
import { Bars, number, percent, reasonName, RequestState, SectionTitle } from './components'

export default function Nabiz({ summary, openRecords }) {
  const years = useApi('/by-year')
  const departments = useApi('/by-department')
  const reasons = useApi('/by-reason')
  return <>
    <header className="page-intro overview-intro">
      <div className="eyebrow"><span className="small-line" /> İNSAN KAYNAKLARINA BİR BAKIŞ</div>
      <h1>Birlikte geçen yıllar.<br /><em>Veride kalan izler.</em></h1>
      <div className="intro-bottom"><p>Her sayı bir kaydın parçası. Çalışanların hangi yıllarda,<br className="desktop-break" /> hangi ekiplerden ayrıldığını birlikte inceleyelim.</p><button className="text-button" onClick={() => openRecords('')}>Kayıtları incele ↗</button></div>
    </header>
    <RequestState request={summary}>{summary.data && <>
      <dl className="headline-numbers">
        <div><dt>Dönem boyunca çalışan</dt><dd>{number(summary.data.toplam_calisan)}</dd><span>Benzersiz çalışan kaydı</span></div>
        <div><dt>Ayrılan çalışan</dt><dd className="accent">{number(summary.data.ayrilan_calisan)}</dd><span>2006–2015 döneminde</span></div>
        <div><dt>Dönem içi ayrılma payı</dt><dd>{percent(summary.data.ayrilma_yuzdesi)}</dd><span>Ayrılan / benzersiz çalışan</span></div>
      </dl>
      <p className="data-caption">Bu oran tüm dönemi kapsar; yıllık devir oranı değildir. Ayrılma kaydı olmayan {number(summary.data.ayrilma_kaydi_olmayan)} kişinin bugün çalıştığı sonucuna varılamaz.</p>
    </>}</RequestState>
    <section className="report-section">
      <SectionTitle index="01 / ZAMAN İÇİNDE" title="On yıl, farklı hikâyeler." description="Ayrılanları, o yıl gözlenen çalışan sayısıyla birlikte değerlendirelim." />
      <RequestState request={years}>
        <AnnualChart items={years.data || []} openRecords={openRecords} />
      </RequestState>
    </section>
    <section className="report-section">
      <SectionTitle index="02 / EKİPLER" title="Ayrılmalar hangi ekiplerde?" description="Tüm dönemde en fazla ayrılma kaydı bulunan altı departman."><a className="text-button" href="#mercek">Tümünü karşılaştır ↗</a></SectionTitle>
      <RequestState request={departments}><Bars items={(departments.data || []).slice(0, 6).map((item) => ({ label: item.departman, value: item.ayrilan_calisan }))} /><p className="data-caption">Büyük ekiplerde ayrılan kişi sayısı da yüksek olabilir. Çalışan sayısına göre yüzdeleri Karşılaştırmalar sayfasında karşılaştırabilirsin.</p></RequestState>
    </section>
    <section className="report-section">
      <SectionTitle index="03 / KAYITLI SEBEPLER" title="Bir ayrılığın üç başlığı." description="Veri setine kaydedilmiş ayrılma sebepleri; tahmin veya yorum değildir." />
      <RequestState request={reasons}><div className="reason-list">{(reasons.data || []).map((item, index) => <div className={`reason-row reason-${index}`} key={item.sebep}><span className="reason-index">0{index + 1}</span><h3>{reasonName(item.sebep)}</h3><span className="reason-number">{number(item.ayrilan_calisan)}<small> kişi</small></span><button className="arrow-button" aria-label={`${reasonName(item.sebep)} kayıtlarını göster`} onClick={() => openRecords('', item.sebep)}>↗</button></div>)}</div></RequestState>
    </section>
  </>
}
