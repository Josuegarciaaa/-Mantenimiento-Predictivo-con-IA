export default function Logo({ size = 28, color = 'currentColor', className = '' }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            {/* Engranaje representando maquinaria industrial */}
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            <circle cx="12" cy="12" r="3.5" />
            
            {/* Curva de prediccion (trend line) cortando el engranaje */}
            <path 
                d="M3 15.5l5.5-4.5 4.5 3 8-7" 
                stroke="var(--color-primary-light)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            
            {/* Nodo de prediccion RUL de IA brillante */}
            <circle 
                cx="21" 
                cy="7" 
                r="2" 
                fill="var(--color-primary-light)" 
                stroke="var(--color-primary)" 
                strokeWidth="0.5"
            />
        </svg>
    )
}
