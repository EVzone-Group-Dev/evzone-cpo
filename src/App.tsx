import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from '@/router/AppRoutes'
import { TenantProvider } from '@/core/contexts/TenantContext'
import { ThemeProvider } from '@/core/theme/ThemeProvider'
import { BrandingProvider } from '@/core/branding/BrandingProvider'
import '@/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <BrandingProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TenantProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TenantProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrandingProvider>
  )
}
