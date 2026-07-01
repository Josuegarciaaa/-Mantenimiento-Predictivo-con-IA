import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Brush
} from 'recharts'

const SENSOR_COLORS = [
    '#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6'
]

function CustomTooltip({ active, payload, label }) {
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
                Ciclo {label}
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

export default function SensorChart({ data = [], sensors = ['sensor_3', 'sensor_7', 'sensor_9'], height = 350, title = '' }) {
    if (!data.length) {
        return (
            <div className="card">
                {title && <div className="card-header"><span className="card-title">{title}</span></div>}
                <div className="empty-state">
                    <div className="empty-state-text">Sin datos de sensores</div>
                </div>
            </div>
        )
    }

    const sensorLabels = {
        sensor_2: 'Temp LPC',
        sensor_3: 'Temp HPC',
        sensor_4: 'Temp LPT',
        sensor_7: 'Presion HPC',
        sensor_8: 'RPM Fan',
        sensor_9: 'RPM Core',
        sensor_11: 'Ps30',
        sensor_12: 'Fuel/Ps30',
        sensor_13: 'Fan Corr.',
        sensor_14: 'Core Corr.',
        sensor_15: 'Bypass',
        sensor_17: 'Bleed Enth.',
        sensor_20: 'HPT Coolant',
        sensor_21: 'LPT Coolant'
    }

    return (
        <div className="card fade-in">
            {title && <div className="card-header"><span className="card-title">{title}</span></div>}
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {sensors.map((sensor, i) => (
                            <linearGradient key={`color${sensor}`} id={`color${sensor}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={SENSOR_COLORS[i % SENSOR_COLORS.length]} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={SENSOR_COLORS[i % SENSOR_COLORS.length]} stopOpacity={0.0}/>
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis
                        dataKey="cycle"
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '0.8rem', paddingTop: '1rem', paddingBottom: '0.5rem' }}
                        iconType="circle"
                    />
                    {sensors.map((sensor, i) => (
                        <Area
                            key={sensor}
                            type="monotone"
                            dataKey={sensor}
                            name={sensorLabels[sensor] || sensor}
                            stroke={SENSOR_COLORS[i % SENSOR_COLORS.length]}
                            fillOpacity={1}
                            fill={`url(#color${sensor})`}
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 0, filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.5))' }}
                        />
                    ))}
                    <Brush 
                        dataKey="cycle" 
                        height={30} 
                        stroke="var(--color-primary-light)" 
                        fill="rgba(15, 23, 42, 0.5)"
                        tickFormatter={() => ''}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
