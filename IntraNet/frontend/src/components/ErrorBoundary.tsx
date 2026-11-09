// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: ErrorBoundary.
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  // Obtiene los datos necesarios.
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Gestiona la operacion componentDidCatch.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  // Gestiona la accion correspondiente.
  private handleReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        // Recorre los elementos de la coleccion.
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // Limpiar caches
      if ('caches' in window) {
        const keys = await caches.keys();
        // Recorre los elementos de la coleccion.
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.error('Error limpiando PWA:', e);
    }
    window.location.reload();
  };

  // Genera la vista del componente.
  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2>Ocurrió un error inesperado</h2>
          <p style={{ color: 'var(--muted-foreground, #666)' }}>
            Es posible que tengas una versión desactualizada almacenada en tu navegador.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'var(--primary, #CC2627)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Actualizar aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
