import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Filtre değişince yeni istek gönderiyoruz, önceki isteği iptal ediyoruz.
export function useApi(path) {
  const [result, setResult] = useState({ data: null, loading: true, error: '' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    setResult({ data: null, loading: true, error: '' })
    fetch(`${API_URL}/api${path}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Veriler alınamadı.')
        return response.json()
      })
      .then((data) => setResult({ data, loading: false, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ data: null, loading: false, error: 'Verilere şu an ulaşılamıyor. API sunucusunun açık olduğunu kontrol et.' })
      })
    return () => controller.abort()
  }, [path, attempt])
  return { ...result, retry: () => setAttempt((value) => value + 1) }
}
