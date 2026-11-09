// Archivo de configuraci?n o entrada: conecta las piezas necesarias para iniciar o compilar el proyecto. Tema específico: punto de entrada del cliente.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { PwaInstallProvider } from './context/PwaInstallContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner.tsx'
import { PwaUpdateToast } from './components/pwa/PwaUpdateToast.tsx'
import { registerServiceWorker } from './pwa/registerSW.ts'
import './styles/index.css'
import './styles/news-feed-premium.css'

registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <PwaInstallProvider>
            <App />
            <PwaInstallBanner />
            <PwaUpdateToast />
          </PwaInstallProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
