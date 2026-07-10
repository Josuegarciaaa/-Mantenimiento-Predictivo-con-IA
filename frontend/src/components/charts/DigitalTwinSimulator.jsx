import React, { useState, useEffect } from 'react';
import { predictionsAPI } from '../../services/api';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { useTranslation } from 'react-i18next';
import './DigitalTwinSimulator.css';

const SENSOR_COLORS_NEG = '#ef4444';
const SENSOR_COLORS_POS = '#10b981';

function ShapTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    return (
        <div style={{
            background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)',
            border: `1px solid ${v < 0 ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
            borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem'
        }}>
            <div style={{ color: '#fafafa', fontWeight: 700 }}>{payload[0].payload.name}</div>
            <div style={{ color: v < 0 ? '#f87171' : '#34d399', fontWeight: 800 }}>
                {v > 0 ? '+' : ''}{v.toFixed(3)} cycles
            </div>
        </div>
    );
}

export default function DigitalTwinSimulator({ engineId, initialData }) {
    const { t } = useTranslation();
    const [overrides, setOverrides] = useState({
        sensor_3:  initialData?.sensor_3  || 610,
        sensor_4:  initialData?.sensor_4  || 505,
        sensor_11: initialData?.sensor_11 || 47.5
    });
    const [simulation, setSimulation] = useState(null);
    const [loading, setLoading] = useState(true); // true on mount = skeleton while loading

    useEffect(() => {
        runSimulation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSliderChange = (sensor, value) => {
        setOverrides(prev => ({ ...prev, [sensor]: parseFloat(value) }));
    };

    const runSimulation = async () => {
        try {
            setLoading(true);
            const res = await predictionsAPI.simulate(engineId, overrides);
            setSimulation(res.data);
        } catch (error) {
            console.error("Simulation failed", error);
        } finally {
            setLoading(false);
        }
    };

    const getShapData = () => {
        if (!simulation?.shap_values) return [];
        return Object.entries(simulation.shap_values)
            .map(([key, value]) => ({ name: key, value: parseFloat(value.toFixed(3)) }))
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .slice(0, 6);
    };

    const shapData = getShapData();
    const simRul = simulation?.simulated_rul ?? null;
    const rulColor = simRul === null ? '#71717a' : simRul < 30 ? '#ef4444' : simRul < 60 ? '#f59e0b' : '#10b981';

    const sliders = [
        { key: 'sensor_3',  label: t('digitalTwin.sensor_3',  'HPC Temperature (sensor_3)'), min: 590, max: 650, step: 0.5, unit: '°R' },
        { key: 'sensor_4',  label: t('digitalTwin.sensor_4',  'LPT Temperature (sensor_4)'), min: 490, max: 550, step: 0.5, unit: '°R' },
        { key: 'sensor_11', label: t('digitalTwin.sensor_11', 'Static Pressure (sensor_11)'), min: 45, max: 50, step: 0.1, unit: 'psia' },
    ];

    return (
        <div className="digital-twin-simulator card">
            {/* Header */}
            <div className="dts-header">
                <div className="dts-title-row">
                    <div className="dts-accent-bar" />
                    <div>
                        <div className="dts-eyebrow">DIGITAL TWIN</div>
                        <div className="dts-title">{t('digitalTwin.title', 'What-If Simulator')}</div>
                    </div>
                </div>
                <p className="dts-subtitle">{t('digitalTwin.subtitle', 'Alter telemetry in real time and observe how the model reacts.')}</p>
            </div>

            <div className="simulator-body">
                {/* Left: controls */}
                <div className="controls-panel">
                    <div className="dts-section-label">{t('digitalTwin.variables', 'Controllable Variables')}</div>

                    {sliders.map(s => (
                        <div key={s.key} className="slider-group">
                            <div className="slider-header">
                                <span className="slider-label">{s.label}</span>
                                <span className="slider-value">{overrides[s.key].toFixed(2)} <span className="slider-unit">{s.unit}</span></span>
                            </div>
                            <div className="slider-track-wrap">
                                <input
                                    type="range"
                                    min={s.min} max={s.max} step={s.step}
                                    value={overrides[s.key]}
                                    onChange={(e) => handleSliderChange(s.key, e.target.value)}
                                    onMouseUp={runSimulation}
                                    onTouchEnd={runSimulation}
                                    className="dts-slider"
                                />
                            </div>
                        </div>
                    ))}

                    <button className="btn btn-primary dts-apply-btn" onClick={runSimulation} disabled={loading}>
                        {loading
                            ? <><span className="dts-spinner" />{t('digitalTwin.calculating', 'Calculating...')}</>
                            : t('digitalTwin.apply', 'Apply Scenario')
                        }
                    </button>
                </div>

                {/* Right: results */}
                <div className="results-panel">
                    {/* RUL gauge */}
                    <div className="dts-rul-card" style={{ borderColor: `${rulColor}33` }}>
                        <div className="dts-section-label">{t('digitalTwin.simulated_rul', 'Simulated RUL')}</div>
                        {loading ? (
                            <div className="dts-skeleton dts-skeleton-rul" />
                        ) : (
                            <div className="dts-rul-value" style={{ color: rulColor }}>
                                {simRul ?? '--'}
                                <span className="dts-rul-unit">{t('digitalTwin.cycles', 'cycles')}</span>
                            </div>
                        )}
                        {!loading && simulation?.anomaly_check?.is_anomalous && (
                            <div className="anomaly-alert blink">
                                {t('digitalTwin.anomaly_warning', 'Warning: critical anomaly detected')}
                            </div>
                        )}
                    </div>

                    {/* SHAP bars */}
                    <div className="dts-shap-card">
                        <div className="dts-section-label">{t('digitalTwin.risk_factors', 'Risk Factor Impact (SHAP)')}</div>
                        {loading ? (
                            <div className="dts-shap-skeleton">
                                {[80, 60, 95, 45, 70, 55].map((w, i) => (
                                    <div key={i} className="dts-skeleton-bar-row">
                                        <div className="dts-skeleton dts-skeleton-label" />
                                        <div className="dts-skeleton dts-skeleton-bar" style={{ width: `${w}%` }} />
                                    </div>
                                ))}
                            </div>
                        ) : shapData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={shapData} layout="vertical" margin={{ top: 4, right: 50, left: 10, bottom: 4 }}>
                                    <XAxis type="number" hide domain={['dataMin - 1', 'dataMax + 1']} />
                                    <YAxis
                                        dataKey="name" type="category"
                                        tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'JetBrains Mono, monospace' }}
                                        axisLine={false} tickLine={false} width={95}
                                    />
                                    <Tooltip content={<ShapTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14} isAnimationActive animationDuration={800}>
                                        <LabelList
                                            dataKey="value"
                                            position="right"
                                            formatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
                                            style={{ fontSize: '10px', fill: '#71717a', fontFamily: 'JetBrains Mono, monospace' }}
                                        />
                                        {shapData.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={entry.value < 0 ? SENSOR_COLORS_NEG : SENSOR_COLORS_POS}
                                                style={{ filter: entry.value < 0 ? 'drop-shadow(0 0 4px rgba(239,68,68,0.5))' : 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="dts-no-shap">
                                <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>◈</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    SHAP values not available for this simulation
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
