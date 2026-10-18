import 'regenerator-runtime/runtime'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'

import './index.scss'
import './PhaserGame'
import muiTheme from './MuiTheme'
import App from './App'
import store from './stores'

// Global error listener to prevent silent black screen
window.addEventListener('error', (event) => {
  console.error('SkyOffice Global Window Error:', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('SkyOffice Unhandled Rejection:', event.reason)
})

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#0f172a',
            color: '#f87171',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 999999,
            fontFamily: 'monospace',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#ef4444', marginBottom: 12 }}>⚠️ Ops! Ocorreu um erro no carregamento da interface</h2>
          <pre
            style={{
              background: '#1e293b',
              color: '#fca5a5',
              padding: 16,
              borderRadius: 8,
              maxWidth: '90vw',
              maxHeight: '40vh',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: 13,
            }}
          >
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Recarregar Página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider theme={muiTheme}>
          <App />
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
)

