import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo })
        console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#050505',
                    padding: '2rem'
                }}>
                    <div style={{
                        maxWidth: '520px',
                        width: '100%',
                        background: 'rgba(24, 24, 27, 0.7)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '2.5rem',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Top accent line */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '15%',
                            right: '15%',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
                            borderRadius: '2px'
                        }} />

                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '1.8rem'
                        }}>
                            ⚠
                        </div>

                        <h2 style={{
                            color: '#fafafa',
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            marginBottom: '0.75rem',
                            letterSpacing: '-0.02em',
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            Algo salió mal
                        </h2>

                        <p style={{
                            color: '#a1a1aa',
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            marginBottom: '1.5rem'
                        }}>
                            La aplicación encontró un error inesperado. Puedes intentar recargar la página o contactar al administrador.
                        </p>

                        {this.state.error && (
                            <details style={{
                                background: 'rgba(239, 68, 68, 0.06)',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                marginBottom: '1.5rem',
                                textAlign: 'left'
                            }}>
                                <summary style={{
                                    color: '#f87171',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    letterSpacing: '0.03em',
                                    textTransform: 'uppercase'
                                }}>
                                    Detalles técnicos
                                </summary>
                                <pre style={{
                                    color: '#a1a1aa',
                                    fontSize: '0.72rem',
                                    marginTop: '0.5rem',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    maxHeight: '150px',
                                    overflow: 'auto'
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: '0.7rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(39, 39, 42, 0.8)',
                                    color: '#fafafa',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontFamily: "'Inter', sans-serif"
                                }}
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '0.7rem 1.5rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#00e5ff',
                                    color: '#050505',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontFamily: "'Inter', sans-serif"
                                }}
                            >
                                Recargar página
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
