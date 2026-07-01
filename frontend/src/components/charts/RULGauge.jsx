import { useMemo } from 'react'

const STATUS_COLORS = {
    low: 'var(--color-healthy)',
    medium: 'var(--color-warning)',
    high: '#f97316',
    critical: 'var(--color-critical)'
}

export default function RULGauge({ rul = 0, maxRul = 125, riskLevel = 'low' }) {
    const percentage = Math.min(100, Math.max(0, (rul / maxRul) * 100))
    const color = STATUS_COLORS[riskLevel] || STATUS_COLORS.low

    const radius = 70
    const strokeWidth = 12
    const circumference = Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className="gauge-container">
            <svg width="180" height="100" viewBox="0 0 180 100">
                <path
                    d="M 10 90 A 70 70 0 0 1 170 90"
                    className="gauge-bg"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <path
                    d="M 10 90 A 70 70 0 0 1 170 90"
                    className="gauge-fill"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="gauge-value">
                <div className="gauge-number" style={{ color }}>{rul}</div>
                <div className="gauge-unit">ciclos restantes</div>
            </div>
        </div>
    )
}
