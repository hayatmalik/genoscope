import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { componentDefaults, theme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={theme} {...componentDefaults}>
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
)
