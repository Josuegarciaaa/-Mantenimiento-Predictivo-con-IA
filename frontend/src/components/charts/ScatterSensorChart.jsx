import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ScatterSensorChart({ data, xSensor, ySensor, xLabel, yLabel, title, height = 300 }) {
    if (!data || data.length === 0) return null

    // Transform data for scatter plot
    const scatterData = data.map(item => ({
        x: item[xSensor],
        y: item[ySensor]
    })).filter(item => item.x != null && item.y != null)

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">{title}</span>
            </div>
            <div style={{ height, padding: 'var(--spacing-md) 0', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis 
                            type="number" 
                            dataKey="x" 
                            name={xLabel} 
                            domain={['auto', 'auto']}
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            stroke="var(--border-color)"
                            label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: 'var(--text-muted)' }}
                        />
                        <YAxis 
                            type="number" 
                            dataKey="y" 
                            name={yLabel} 
                            domain={['auto', 'auto']}
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            stroke="var(--border-color)"
                            label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }}
                        />
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ 
                                backgroundColor: 'var(--card-bg)', 
                                borderColor: 'var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                        />
                        <Scatter name={`${xLabel} vs ${yLabel}`} data={scatterData} fill="var(--color-primary)" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
