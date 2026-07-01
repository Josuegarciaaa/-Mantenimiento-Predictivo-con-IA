import { useState, useEffect } from 'react'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'
import { sensorsAPI } from '../../services/api'

export default function EngineSparkline({ engineId, color = '#6366f1' }) {
    const [data, setData] = useState([])
    
    useEffect(() => {
        let mounted = true
        async function fetchLastReadings() {
            try {
                const res = await sensorsAPI.getData(engineId, 15) // ultimos 15 ciclos
                if (mounted && res.data && res.data.readings) {
                    setData(res.data.readings)
                }
            } catch (err) {
                // silencioso para el sparkline
            }
        }
        fetchLastReadings()
        return () => { mounted = false }
    }, [engineId])

    if (!data.length) return <div style={{ height: '30px', width: '80px', opacity: 0.3, background: 'var(--bg-input)', borderRadius: '4px' }}></div>

    return (
        <div style={{ height: '35px', width: '90px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`spark${engineId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                            <stop offset="100%" stopColor={color} stopOpacity={0.0}/>
                        </linearGradient>
                    </defs>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Area 
                        type="monotone" 
                        dataKey="sensor_14" 
                        stroke={color} 
                        fill={`url(#spark${engineId})`}
                        strokeWidth={2}
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
