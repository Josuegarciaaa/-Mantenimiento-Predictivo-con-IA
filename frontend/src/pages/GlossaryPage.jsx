import React from 'react'
import { useTranslation } from 'react-i18next'

export default function GlossaryPage() {
    const { t } = useTranslation()

    return (
        <div className="fade-in" style={{ padding: '0 0 2rem 0' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">{t('glossary.title')}</h1>
                <p className="page-subtitle">{t('glossary.subtitle')}</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* Modulo 1: Conceptos Principales */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">{t('glossary.mod1_title')}</span>
                    </div>
                    <div style={{ padding: '1.5rem', lineHeight: '1.6' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>{t('glossary.rul_title')}</h4>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                {t('glossary.rul_desc1')}
                            </p>
                            <p style={{ color: 'var(--text-muted)' }}>
                                {t('glossary.rul_desc2')}
                            </p>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--color-warning)', marginBottom: '0.5rem' }}>{t('glossary.risk_levels')}</h4>
                            <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}><strong>{t('glossary.risk_healthy')}</strong></li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>{t('glossary.risk_med')}</strong></li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>{t('glossary.risk_high')}</strong></li>
                                <li><strong style={{ color: 'var(--color-critical)' }}>{t('glossary.risk_critical')}</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Modulo 2: Diccionario de Sensores */}
                <div className="card">
                    <div className="card-header"><span className="card-title">{t('glossary.mod2_title')}</span></div>
                    <div style={{ padding: '1.5rem', lineHeight: '1.6' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--spacing-lg)' }}>
                            {t('glossary.mod2_desc')}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <div style={{ backgroundColor: 'var(--bg-default)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <h5 style={{ marginTop: 0, color: 'var(--color-primary-light)', marginBottom: 'var(--spacing-xs)' }}>{t('glossary.sensor3_title')}</h5>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                                    {t('glossary.sensor3_desc')}
                                </p>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-default)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <h5 style={{ marginTop: 0, color: 'var(--color-primary-light)', marginBottom: 'var(--spacing-xs)' }}>{t('glossary.sensor11_title')}</h5>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                                    {t('glossary.sensor11_desc')}
                                </p>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-default)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <h5 style={{ marginTop: 0, color: 'var(--color-primary-light)', marginBottom: 'var(--spacing-xs)' }}>{t('glossary.sensor14_title')}</h5>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                                    {t('glossary.sensor14_desc')}
                                </p>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-default)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <h5 style={{ marginTop: 0, color: 'var(--color-primary-light)', marginBottom: 'var(--spacing-xs)' }}>{t('glossary.sensor2_title')}</h5>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                                    {t('glossary.sensor2_desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
