import { useEffect, useState } from 'react'

function App() {
  const [employeeCount, setEmployeeCount] = useState(null)
  const [error, setError] = useState('')
  const [departureCount, setDepartureCount] = useState(null)
  const [yearlyDepartures, setYearlyDepartures] = useState(null)
  const [yearlyError, setYearlyError] = useState('')

  // Sayfa açılınca API'den çalışan sayısını alıyoruz.
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/employee-count')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Çalışan sayısı alınamadı.')
        }
        return response.json()
      })
      .then((data) => {
        setEmployeeCount(data.toplam_calisan)
      })
      .catch(() => {
        setError('API’ye ulaşılamadı.')
      })
  }, [])

  // API'den ayrılan çalışan sayısını alıyoruz.
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/departure-count')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ayrılan çalışan sayısı alınamadı.')
        }
        return response.json()
      })
      .then((data) => {
        setDepartureCount(data.ayrilan_calisan)
      })
      .catch(() => {
        setError('Ayrılan çalışan sayısı alınamadı.')
      })
  }, [])

  // Yıllara göre ayrılma sayılarını API'den alıyoruz.
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/by-year')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Yıllık veriler alınamadı.')
        }
        return response.json()
      })
      .then((data) => {
        setYearlyDepartures(data)
      })
      .catch(() => {
        setYearlyError('Yıllık ayrılma verileri alınamadı.')
      })
  }, [])

  return (
    <main>
      <h1>Kalan & Giden</h1>
      <p>Çalışan ayrılma analizi</p>

      {error ? (
        <p>{error}</p>
      ) : (
        <>
          <p>Toplam çalışan: {employeeCount ?? 'Yükleniyor…'}</p>
          <p>Ayrılan çalışan: {departureCount ?? 'Yükleniyor…'}</p>
        </>
      )}

      <h2>Yıllara göre ayrılanlar</h2>
      <p>2006–2015 döneminde kaydedilen ayrılmalar</p>

      {yearlyError ? (
        <p role="alert">{yearlyError}</p>
      ) : yearlyDepartures === null ? (
        <p>Yükleniyor…</p>
      ) : yearlyDepartures.length === 0 ? (
        <p>Yıllık ayrılma kaydı bulunamadı.</p>
      ) : (
        <ul>
          {yearlyDepartures.map((item) => (
            <li key={item.yil}>
              {item.yil}: {item.ayrilan_calisan} kişi
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
