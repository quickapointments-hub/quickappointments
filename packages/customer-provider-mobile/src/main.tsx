import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalRootErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  override state: GlobalErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    console.error('GlobalRootErrorBoundary caught uncaught error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#EFF8E7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            marginBottom: '16px'
          }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111111', marginBottom: '8px' }}>
            Quick Appointments
          </h2>
          <p style={{
            fontSize: '12px',
            color: '#DC2626',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            padding: '10px 14px',
            borderRadius: '12px',
            maxWidth: '360px',
            wordBreak: 'break-word',
            marginBottom: '16px'
          }}>
            {this.state.error?.message || 'Application crash'}
          </p>
          <button
            onClick={() => {
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch {}
              window.location.reload();
            }}
            style={{
              padding: '10px 22px',
              backgroundColor: '#65B32E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Reset & Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalRootErrorBoundary>
      <App />
    </GlobalRootErrorBoundary>
  </React.StrictMode>
);
