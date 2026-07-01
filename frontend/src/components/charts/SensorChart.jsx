import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts'

const SENSOR_COLORS = [
    '#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6'
]

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.8rem'
        }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Ciclo {label}
            </div>
            {payload.map((entry, i) => (
                <div key={i} style={{ color: entry.color, marginBottom: '0.15rem' }}>
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                </div>
            ))}
        </div>
    )
}

export default function SensorChart({ data = [], sensors = ['sensor_3', 'sensor_7', 'sensor_9'], height = 320, title = '' }) {
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
        <div className="card">
            {title && <div className="card-header"><span className="card-title">{title}</span></div>}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis
                        dataKey="cycle"
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '0.78rem', paddingTop: '0.5rem' }}
                    />
                    {sensors.map((sensor, i) => (
                        <Line
                            key={sensor}
                            type="monotone"
                            dataKey={sensor}
                            name={sensorLabels[sensor] || sensor}
                            stroke={SENSOR_COLORS[i % SENSOR_COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
