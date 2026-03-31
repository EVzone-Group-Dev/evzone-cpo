import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function isMswEnabled() {
  const configured = String(import.meta.env.VITE_ENABLE_MSW ?? 'false').trim().toLowerCase()
  return import.meta.env.MODE === 'development' && configured === 'true'
}

async function unregisterMockServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations
      .filter((registration) => registration.active?.scriptURL.includes('mockServiceWorker.js'))
      .map((registration) => registration.unregister()),
  )
}

async function enableMocking() {
  if (!isMswEnabled()) {
    await unregisterMockServiceWorker()
    return
  }

  const { worker } = await import('./mocks/browser')

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
