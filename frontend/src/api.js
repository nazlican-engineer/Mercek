import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Önceki filtrenin sonucunu göstermiyoruz; eski isteği iptal ediyoruz.
export function useApi(path) {
  const [result, setResult] = useState({ key: '', data: null, error: '' })
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([path, attempt])
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    let cancelled = false
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; controller.abort() }, 20000)
    fetch(`${API_URL}/api${path}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Veriler alınamadı.')
        return response.json()
      })
      .then((data) => { if (!cancelled) setResult({ key, data, error: '' }) })
      .catch(() => {
        if (!cancelled) setResult({ key, data: null, error: timedOut ? 'Yanıt gecikti. Tekrar deneyebilirsin.' : 'Verilere şu an ulaşılamıyor. API sunucusunun açık olduğunu kontrol et.' })
      })
      .finally(() => clearTimeout(timer))
    return () => { cancelled = true; clearTimeout(timer); controller.abort() }
  }, [path, key])
  const current = !!path && result.key === key
  return {
    data: current ? result.data : null,
    error: current ? result.error : '',
    loading: !!path && !current,
    retry: () => setAttempt((value) => value + 1),
  }
}
