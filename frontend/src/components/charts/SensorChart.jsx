import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Brush
} from 'recharts'
import { useTranslation } from 'react-i18next'
import LiveIndicator from './LiveIndicator.jsx'

const SENSOR_COLORS = [
    '#00e5ff', '#10b981', '#f59e0b', '#f43f5e',
    '#a855f7', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
]

function CustomTooltip({ active, payload, label }) {
    const { t } = useTranslation()
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: 'rgba(26, 35, 50, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-color-hover)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.85rem'
        }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                {t('engineDetail.cycles')} {label}
            </div>
            {payload.map((entry, i) => (
                <div key={i} style={{ color: entry.color, marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span>{entry.name}:</span>
                    <span style={{ fontWeight: 600 }}>{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
                </div>
            ))}
        </div>
    )
}

export default function SensorChart({ data = [], sensors = ['sensor_3', 'sensor_7', 'sensor_9'], height = 350, title = '', isLive = false }) {
    const { t } = useTranslation()

    if (!data.length) {
        return (
            <div className="card">
                {title && (
                    <div className="card-header">
                        <span className="card-title">{title}</span>
                        {isLive && <LiveIndicator />}
                    </div>
                )}
                <div className="empty-state">
                    <div className="empty-state-text">{t('engineDetail.no_sensor_data')}</div>
                </div>
            </div>
        )
    }

    const sensorLabels = {
        sensor_2: 'Temp LPC',
        sensor_3: t('engineDetail.temp_hpc') || 'Temp HPC',
        sensor_4: 'Temp LPT',
        sensor_7: 'Presion HPC',
        sensor_8: 'RPM Fan',
        sensor_9: 'RPM Core',
        sensor_11: t('engineDetail.pressure_hpc') || 'Ps30',
        sensor_12: 'Fuel/Ps30',
        sensor_13: 'Fan Corr.',
        sensor_14: t('engineDetail.core_speed') || 'Core Corr.',
        sensor_15: 'Bypass',
        sensor_17: 'Bleed Enth.',
        sensor_20: 'HPT Coolant',
        sensor_21: 'LPT Coolant'
    }

    return (
        <div className="card fade-in">
            {title && (
                <div className="card-header">
                    <span className="card-title">{title}</span>
                    {isLive && <LiveIndicator color="cyan" />}
                </div>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {sensors.map((sensor, i) => (
                            <linearGradient key={`color${sensor}`} id={`color${sensor}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={SENSOR_COLORS[i % SENSOR_COLORS.length]} stopOpacity={0.55}/>
                                <stop offset="60%" stopColor={SENSOR_COLORS[i % SENSOR_COLORS.length]} stopOpacity={0.12}/>
                                <stop offset="100%" stopColor={SENSOR_COLORS[i % SENSOR_COLORS.length]} stopOpacity={0.0}/>
                            </linearGradient>
                        ))}
                        <filter id="lineGlow">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                        dataKey="cycle"
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        dy={10}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        domain={['auto', 'auto']}
                        width={52}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{
                            fontSize: '0.78rem',
                            paddingTop: '1.2rem',
                            paddingBottom: '0.5rem',
                            fontFamily: 'Inter, sans-serif',
                            letterSpacing: '0.03em'
                        }}
                        iconType="circle"
                        iconSize={8}
                    />
                    {sensors.map((sensor, i) => (
                        <Area
                            key={sensor}
                            type="monotoneX"
                            dataKey={sensor}
                            name={sensorLabels[sensor] || sensor}
                            stroke={SENSOR_COLORS[i % SENSOR_COLORS.length]}
                            fillOpacity={1}
                            fill={`url(#color${sensor})`}
                            strokeWidth={3.5}
                            filter="url(#lineGlow)"
                            isAnimationActive={true}
                            animationBegin={i * 120}
                            animationDuration={1200}
                            animationEasing="ease-out"
                            activeDot={{
                                r: 8,
                                strokeWidth: 2,
                                stroke: SENSOR_COLORS[i % SENSOR_COLORS.length],
                                fill: '#050505',
                                filter: `drop-shadow(0px 0px 10px ${SENSOR_COLORS[i % SENSOR_COLORS.length]})`
                            }}
                            dot={false}
                        />
                    ))}
                    <Brush 
                        dataKey="cycle" 
                        height={26} 
                        stroke="rgba(0,229,255,0.3)" 
                        fill="rgba(0, 5, 15, 0.7)"
                        travellerWidth={6}
                        tickFormatter={() => ''}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
