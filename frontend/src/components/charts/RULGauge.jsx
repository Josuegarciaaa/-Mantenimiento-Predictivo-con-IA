import { useEffect, useState } from 'react'

const STATUS_COLORS = {
    low: 'var(--color-healthy)',
    medium: 'var(--color-warning)',
    high: '#f97316',
    critical: 'var(--color-critical)'
}

export default function RULGauge({ rul = 0, maxRul = 125, riskLevel = 'low' }) {
    const [animatedRul, setAnimatedRul] = useState(0)

    useEffect(() => {
        // Simple animation
        let start = 0
        const end = rul
        const duration = 1000
        const startTime = performance.now()

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4)
            
            setAnimatedRul(Math.round(start + (end - start) * easeProgress))

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }
        
        requestAnimationFrame(animate)
    }, [rul])

    const percentage = Math.min(100, Math.max(0, (animatedRul / maxRul) * 100))
    const color = STATUS_COLORS[riskLevel] || STATUS_COLORS.low

    const radius = 70
    const strokeWidth = 14
    const circumference = Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className="gauge-container" style={{ filter: `drop-shadow(0 0 12px ${color}33)` }}>
            <svg width="180" height="100" viewBox="0 0 180 100">
                <defs>
                    <linearGradient id="gaugeBg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--bg-input)" />
                        <stop offset="100%" stopColor="var(--bg-input)" stopOpacity="0.5" />
                    </linearGradient>
                </defs>
                <path
                    d="M 10 90 A 70 70 0 0 1 170 90"
                    stroke="url(#gaugeBg)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M 10 90 A 70 70 0 0 1 170 90"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s ease-out, stroke 0.3s ease' }}
                />
            </svg>
            <div className="gauge-value">
                <div className="gauge-number" style={{ color }}>{animatedRul}</div>
                <div className="gauge-unit">ciclos restantes</div>
            </div>
        </div>
    )
}
