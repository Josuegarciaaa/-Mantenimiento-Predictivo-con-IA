import './LiveIndicator.css'

/**
 * LiveIndicator
 * Pulsing badge that shows a live data stream indicator.
 * Props:
 *   - label: string (default "live")
 *   - color: 'green' | 'cyan' | 'red' | 'amber' (default 'cyan')
 */
export default function LiveIndicator({ label = 'live', color = 'cyan' }) {
    return (
        <div className={`live-indicator live-indicator--${color}`}>
            <span className="live-dot" />
            <span className="live-label">{label}</span>
        </div>
    )
}
