import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { reportsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function FleetEconomicsPage() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadEconomics();
    }, []);

    async function loadEconomics() {
        try {
            setLoading(true);
            const res = await reportsAPI.getEconomics();
            setData(res.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="page-loading">{t('common.loading', 'Loading...')}</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!data) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="fade-in" style={{ paddingBottom: '2rem' }}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('economics.title')}</h1>
                    <p className="page-subtitle">{t('economics.subtitle')}</p>
                </div>
                <button onClick={loadEconomics} className="btn btn-secondary">
                    {t('common.refresh', 'Actualizar')}
                </button>
            </header>

            {/* KPI Cards */}
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.2))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase' }}>{t('economics.unplanned_avoided')}</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', margin: '0.5rem 0' }}>
                        {formatCurrency(data.summary.downtimeAvoidedCost)}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{t('economics.unplanned_desc')}</p>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.2))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase' }}>{t('economics.fleet_value')}</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', margin: '0.5rem 0' }}>
                        {formatCurrency(data.summary.totalRemainingValue)}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{t('economics.fleet_value_desc')}</p>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.2))', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase' }}>{t('economics.risk_exposure')}</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444', margin: '0.5rem 0' }}>
                        {formatCurrency(data.summary.riskExposure)}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{t('economics.risk_desc')}</p>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '2rem', alignItems: 'stretch' }}>
                {/* ROI History Chart */}
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                        <span className="card-title">{t('economics.roi_history')}</span>
                    </div>
                    <div style={{ flex: 1, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.roiHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v/1000}k`} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="unplannedCostAvoided" name={t('economics.roi_savings')} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="preventiveCost" name={t('economics.roi_cost')} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Fleet Risk Distribution */}
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    <div className="card-header">
                        <span className="card-title">{t('economics.risk_distribution')}</span>
                    </div>
                    <div style={{ flex: 1, marginTop: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                                    <th style={{ padding: '10px 0' }}>{t('economics.engine')}</th>
                                    <th>{t('economics.rul_remaining')}</th>
                                    <th>{t('economics.estimated_value')}</th>
                                    <th>{t('economics.potential_risk')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.fleet.slice(0, 10).map((engine) => (
                                    <tr key={engine.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px 0' }}>
                                            {engine.name}
                                            {engine.isAtRisk && <span style={{ marginLeft: '8px', color: '#ef4444', fontSize: '12px' }}>⚠️ {t('economics.danger')}</span>}
                                        </td>
                                        <td>{engine.rul.toFixed(1)} {t('economics.cycles')}</td>
                                        <td style={{ color: '#3b82f6' }}>{formatCurrency(engine.remainingValue)}</td>
                                        <td style={{ color: engine.potentialLoss > 0 ? '#ef4444' : '#94a3b8' }}>
                                            {engine.potentialLoss > 0 ? formatCurrency(engine.potentialLoss) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
