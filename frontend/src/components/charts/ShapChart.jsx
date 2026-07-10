import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { useTranslation } from 'react-i18next'

// Nombres legibles de sensores para el panel XAI
const SENSOR_NAMES = {
    sensor_2:  'Temp. LPC (T2)',
    sensor_3:  'Temp. HPC (T30)',
    sensor_4:  'Temp. LPT (T50)',
    sensor_7:  'Presion HPC (P30)',
    sensor_8:  'RPM Fan (N1)',
    sensor_9:  'RPM Nucleo (Nf)',
    sensor_11: 'Presion Estatica (Ps30)',
    sensor_12: 'Ratio Combustible',
    sensor_13: 'Fan Corr. Speed',
    sensor_14: 'Core Corr. Speed',
    sensor_15: 'Bypass Ratio',
    sensor_17: 'Entalpia Sangrado',
    sensor_20: 'Refrigeracion HPT',
    sensor_21: 'Refrigeracion LPT',
    op_setting_1: 'Config. Operacion 1',
    op_setting_2: 'Config. Operacion 2',
    op_setting_3: 'Config. Operacion 3',
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const val = payload[0].value
    const feature = payload[0].payload.feature
    const displayName = SENSOR_NAMES[feature] || feature
    const isNegative = val < 0
    return (
        <div style={{
            background: 'rgba(9, 9, 11, 0.95)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${isNegative ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: isNegative ? '0 0 20px rgba(239,68,68,0.15)' : '0 0 20px rgba(16,185,129,0.15)',
            fontSize: '0.82rem',
            minWidth: '200px'
        }}>
            <div style={{ color: '#fafafa', fontWeight: 700, marginBottom: '6px', fontSize: '0.88rem' }}>{displayName}</div>
            <div style={{ color: isNegative ? '#f87171' : '#34d399', fontWeight: 800, fontSize: '1.1rem' }}>
                {val > 0 ? '+' : ''}{val.toFixed(3)} ciclos
            </div>
            <div style={{ color: '#71717a', fontSize: '0.75rem', marginTop: '4px' }}>
                {isNegative ? 'Reduce la vida util del motor' : 'Aporta estabilidad al motor'}
            </div>
        </div>
    )
}

export default function ShapChart({ shapValues, height = 320 }) {
    const { t } = useTranslation()

    if (!shapValues || Object.keys(shapValues).length === 0) {
        return (
            <div style={{
                height,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: 'var(--text-muted)'
            }}>
                <div style={{ fontSize: '2rem', opacity: 0.3 }}>◈</div>
                <div style={{ fontSize: '0.85rem' }}>esperando datos de explicabilidad XAI...</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>disponibles con el modelo XGBoost Ensemble</div>
            </div>
        )
    }

    const data = Object.entries(shapValues)
        .map(([feature, value]) => ({
            feature,
            displayName: SENSOR_NAMES[feature] || feature,
            value: parseFloat(value.toFixed(3))
        }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 8)

    // Calcular el sensor mas critico
    const mostCritical = [...data].sort((a, b) => a.value - b.value)[0]
    const mostPositive = [...data].sort((a, b) => b.value - a.value)[0]
    const criticalName = mostCritical ? (SENSOR_NAMES[mostCritical.feature] || mostCritical.feature) : null

    return (
        <div>
            {/* Resumen en lenguaje natural */}
            {criticalName && mostCritical.value < 0 && (
                <div style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    color: '#a1a1aa'
                }}>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>factor critico: </span>
                    <span style={{ color: '#fafafa' }}>{criticalName}</span>
                    {' '}esta impactando el RUL en{' '}
                    <span style={{ color: '#f87171', fontWeight: 700 }}>{mostCritical.value.toFixed(2)} ciclos</span>
                    {mostPositive && mostPositive.value > 0 && (
                        <>
                            {'. factor estabilizador: '}
                            <span style={{ color: '#34d399', fontWeight: 700 }}>
                                {SENSOR_NAMES[mostPositive.feature] || mostPositive.feature}
                            </span>
                            {' (+'}
                            <span style={{ color: '#34d399' }}>{mostPositive.value.toFixed(2)}</span>
                            {' ciclos)'}
                        </>
                    )}
                    {'. consulta al copilot para mas detalles sobre estos sensores.'}
                </div>
            )}

            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                    >
                        <XAxis
                            type="number"
                            hide
                            domain={['dataMin - 2', 'dataMax + 2']}
                        />
                        <YAxis
                            dataKey="displayName"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'Inter' }}
                            width={130}
                        />
                        <RechartsTooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[0, 6, 6, 0]}
                            barSize={18}
                            isAnimationActive={true}
                            animationBegin={100}
                            animationDuration={900}
                            animationEasing="ease-out"
                        >
                            <LabelList
                                dataKey="value"
                                position="right"
                                formatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
                                style={{ fontSize: '10px', fill: '#71717a', fontFamily: 'JetBrains Mono, monospace' }}
                            />
                            {data.map((entry, index) => {
                                const isNeg = entry.value < 0
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={isNeg
                                            ? 'url(#negGrad)'
                                            : 'url(#posGrad)'
                                        }
                                        style={{ filter: isNeg
                                            ? 'drop-shadow(0 0 4px rgba(239,68,68,0.5))'
                                            : 'drop-shadow(0 0 4px rgba(16,185,129,0.5))'
                                        }}
                                    />
                                )
                            })}
                        </Bar>
                        <defs>
                            <linearGradient id="negGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#7f1d1d" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="posGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#064e3b" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
