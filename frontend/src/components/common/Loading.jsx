export default function Loading({ text = 'Cargando...' }) {
    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>{text}</span>
        </div>
    )
}
