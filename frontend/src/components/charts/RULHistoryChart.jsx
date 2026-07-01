import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    
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
                {new Date(data.prediction_date).toLocaleString('es-MX')}
            </div>
            <div style={{ color: 'var(--color-primary-light)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span>RUL Estimado:</span>
                <span style={{ fontWeight: 600 }}>{data.predicted_rul} ciclos</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span>Confianza:</span>
                <span style={{ fontWeight: 600 }}>{(data.confidence * 100).toFixed(1)}%</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span>Riesgo:</span>
                <span className={`badge badge-${data.risk_level === 'critical' ? 'critical' : data.risk_level === 'high' ? 'warning' : 'healthy'}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                    {data.risk_level.toUpperCase()}
                </span>
            </div>
        </div>
    )
}

export default function RULHistoryChart({ predictions = [], height = 250 }) {
    if (!predictions.length) {
        return (
            <div className="empty-state">
                <div className="empty-state-text">Sin historial de predicciones de RUL</div>
            </div>
        )
    }

    // ordenar por id porsiaca vienen desordenadas
    const sortedData = [...predictions].sort((a, b) => a.id - b.id)

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorRul" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis 
                    dataKey="id" 
                    stroke="var(--text-muted)" 
                    tick={false} 
                    axisLine={false} 
                />
                <YAxis 
                    stroke="var(--text-muted)" 
                    tick={{ fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    domain={[0, 150]}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <ReferenceLine y={30} stroke="var(--color-warning)" strokeDasharray="3 3" opacity={0.5} />
                <ReferenceLine y={15} stroke="var(--color-critical)" strokeDasharray="3 3" opacity={0.5} />

                <Area 
                    type="monotone" 
                    dataKey="predicted_rul" 
                    stroke="var(--color-primary)" 
                    fillOpacity={1} 
                    fill="url(#colorRul)" 
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0, filter: 'drop-shadow(0px 0px 4px rgba(99,102,241,0.5))' }}
                    isAnimationActive={true}
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
