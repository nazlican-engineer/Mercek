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
      <div><div className="eyebrow"><span className="small-line" /> PEOPLE ANALYTICS AT A GLANCE</div><h1>A closer look at data.<br /><em>A broader view of people.</em></h1><p>Explore years, teams, and departure reasons in one view.</p></div>
      <button className="text-button" onClick={() => openRecords(year)}>Explore records ↗</button>
    </header>
    <div className="dashboard-filter"><div><span className="eyebrow">ANALYTICS DASHBOARD</span><p>{period} period <span>· Recorded departures</span></p></div><label className="period-select">Analysis period<select value={year} onChange={(event) => setYear(event.target.value)}><option value="">All years · 2006–2015</option>{Array.from({ length: 10 }, (_, index) => 2006 + index).map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
    <RequestState request={year ? years : summary}>{totals && <dl className="headline-numbers">
      <div><dt>{year ? 'Employees observed in the year' : 'Employees observed in the period'}</dt><dd>{number(totals.toplam_calisan)}</dd><span>Unique employees</span></div>
      <div><dt>Employees who left</dt><dd className="accent">{number(totals.ayrilan_calisan)}</dd><span>{period} period</span></div>
      <div><dt>Departure share</dt><dd>{percent(totals.ayrilma_yuzdesi)}</dd><span>Departures / observed employees</span></div>
    </dl>}</RequestState>
    <p className="data-caption">The share uses unique employees observed in the selected period, rather than average headcount. It is not a standard turnover rate. No departure record does not mean an employee still works there today.</p>
    <div className="dashboard-grid">
      <section className="dashboard-panel dashboard-wide"><SectionTitle index="01 / ANNUAL TREND" title="Departures over time." description="This chart always shows all ten years to preserve the historical context." /><RequestState request={years}><AnnualChart items={years.data || []} openRecords={openRecords} /></RequestState></section>
      <section className="dashboard-panel dashboard-wide"><SectionTitle index="02 / YEAR AND REASON" title="The story behind each year." description="Column height shows total departures; colors show recorded reasons. The selected year is highlighted." /><RequestState request={departures}><StackedYears records={allRecords} years={Array.from({ length: 10 }, (_, index) => 2006 + index)} selectedYear={year} onSelect={setYear} /></RequestState></section>
      <section className="dashboard-panel"><SectionTitle index={`03 / REASONS · ${period}`} title="Why did they leave?" description="Percentages are shares of departures in the selected period." /><RequestState request={departures}><ReasonDonut records={records} openRecords={openRecords} year={year} /></RequestState></section>
      <section className="dashboard-panel"><SectionTitle index={`04 / TENURE · ${period}`} title="After how many years?" description="Length of service at the time of departure." /><RequestState request={departures}>{records.length ? <TenureChart records={records} /> : <p className="empty-state">No departures were recorded in this period.</p>}</RequestState><div className="dashboard-note"><span className="eyebrow">READING THE DATA</span><p>These charts describe recorded historical departures across three reason categories. They do not predict employee outcomes.</p></div></section>
    </div>
  </>
}
