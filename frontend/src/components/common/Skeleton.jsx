import './Skeleton.css'

export function SkeletonBox({ width, height, style, className = '' }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height, ...style }}
        />
    )
}

export function SkeletonKPI() {
    return (
        <div className="skeleton-kpi">
            <div className="skeleton skeleton-kpi-label" />
            <div className="skeleton skeleton-kpi-value" />
            <div className="skeleton skeleton-kpi-sub" />
        </div>
    )
}

export function SkeletonEngineCard() {
    return (
        <div className="skeleton-engine-card">
            <div className="skeleton-engine-header">
                <div className="skeleton skeleton-circle skeleton-engine-dot" />
                <div>
                    <div className="skeleton skeleton-engine-name" />
                    <div className="skeleton skeleton-engine-id" />
                </div>
            </div>
            <div className="skeleton skeleton-engine-gauge" />
            <div className="skeleton-engine-footer">
                <div className="skeleton skeleton-engine-foot-item" />
                <div className="skeleton skeleton-engine-foot-item" />
            </div>
        </div>
    )
}

export function SkeletonAlertItem() {
    return (
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <SkeletonBox width="70px" height="20px" style={{ borderRadius: '9999px' }} />
                <SkeletonBox width="80px" height="28px" style={{ borderRadius: '8px' }} />
            </div>
            <SkeletonBox width="100%" height="12px" style={{ marginBottom: '4px' }} />
            <SkeletonBox width="75%" height="12px" />
        </div>
    )
}

export function SkeletonCard({ children, style }) {
    return (
        <div className="skeleton-card" style={style}>
            <div className="skeleton-card-header">
                <div className="skeleton skeleton-card-title" />
                <div className="skeleton skeleton-card-badge" />
            </div>
            {children}
        </div>
    )
}

export function SkeletonTableRow({ columns = 4 }) {
    return (
        <div className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton skeleton-table-cell"
                    style={{ flex: i === 0 ? 2 : 1 }}
                />
            ))}
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="skeleton-dashboard">
            {/* KPI Row */}
            <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <SkeletonKPI />
                <SkeletonKPI />
                <SkeletonKPI />
                <SkeletonKPI />
            </div>

            {/* Main Grid */}
            <div className="grid-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
                {/* Engines card */}
                <SkeletonCard>
                    <div className="skeleton-engine-grid">
                        <SkeletonEngineCard />
                        <SkeletonEngineCard />
                        <SkeletonEngineCard />
                        <SkeletonEngineCard />
                    </div>
                </SkeletonCard>

                {/* Alerts card */}
                <SkeletonCard>
                    <SkeletonAlertItem />
                    <SkeletonAlertItem />
                    <SkeletonAlertItem />
                </SkeletonCard>
            </div>

            {/* Fleet Map Skeleton */}
            <SkeletonCard style={{ marginTop: '24px' }}>
                <SkeletonBox width="100%" height="350px" style={{ borderRadius: '12px' }} />
            </SkeletonCard>
        </div>
    )
}
