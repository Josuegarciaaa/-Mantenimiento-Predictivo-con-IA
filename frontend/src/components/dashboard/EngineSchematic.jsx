import React from 'react';

export default function EngineSchematic({ rpm = 0, hpcTemp = 0, isAnomalous = false, riskLevel = 'healthy' }) {
    // calcular velocidad de rotacion usando los RPM
    const animationDuration = rpm > 5000 ? '0.5s' : rpm > 2000 ? '1s' : '3s';
    
    // Determinar color de la zona HPC (High Pressure Compressor)
    let hpcColor = '#3b82f6'; // Azul normal
    if (hpcTemp > 650) hpcColor = '#ef4444'; // rojo critico
    else if (hpcTemp > 615) hpcColor = '#f59e0b'; // Naranja alerta

    // Estado general del motor
    const strokeColor = isAnomalous || riskLevel === 'critical' ? '#ef4444' : '#10b981';
    
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: `1px solid ${strokeColor}33`, overflow: 'hidden' }}>
            
            <svg viewBox="0 0 800 400" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 10px ${strokeColor}55)` }}>
                {/* Background Grid */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                </pattern>
                <rect width="800" height="400" fill="url(#grid)" />

                {/* Carcasa Exterior (Casing) */}
                <path d="M 100,100 C 300,80 500,80 700,140 L 700,260 C 500,320 300,320 100,300 Z" fill="none" stroke="#475569" strokeWidth="4" />
                
                {/* Zona Bypass */}
                <path d="M 120,120 C 300,105 450,110 650,150 L 650,250 C 450,290 300,295 120,280 Z" fill="rgba(255,255,255,0.02)" stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />

                {/* Eje Central (Shaft) */}
                <rect x="150" y="190" width="500" height="20" fill="#94a3b8" />

                {/* Fan Frontal (Rotatorio) */}
                <g style={{ transformOrigin: '140px 200px', animation: `spin ${animationDuration} linear infinite` }}>
                    <ellipse cx="140" cy="200" rx="10" ry="80" fill="#64748b" />
                    <ellipse cx="140" cy="200" rx="80" ry="10" fill="#64748b" />
                    <circle cx="140" cy="200" r="15" fill="#f8fafc" />
                </g>

                {/* LPC (Low Pressure Compressor) */}
                <polygon points="220,160 280,170 280,230 220,240" fill="#38bdf8" opacity="0.6" />
                <text x="250" y="270" fill="#94a3b8" fontSize="12" textAnchor="middle">LPC</text>

                {/* HPC (High Pressure Compressor) - Cambia de color con la temperatura */}
                <polygon points="300,175 380,185 380,215 300,225" fill={hpcColor} opacity="0.8" style={{ transition: 'fill 0.5s ease' }} />
                <text x="340" y="260" fill={hpcColor} fontSize="12" textAnchor="middle" style={{ fontWeight: hpcTemp > 650 ? 'bold' : 'normal' }}>
                    HPC ({hpcTemp.toFixed(1)}°C)
                </text>

                {/* Cámara de Combustión (Combustor) */}
                <polygon points="400,180 460,180 460,220 400,220" fill="url(#fireGradient)" opacity={rpm > 1000 ? 0.9 : 0.3} />
                <text x="430" y="270" fill="#fca5a5" fontSize="12" textAnchor="middle">Cámara</text>

                {/* HPT (High Pressure Turbine) */}
                <polygon points="480,175 520,165 520,235 480,225" fill="#c084fc" opacity="0.7" />
                <text x="500" y="260" fill="#c084fc" fontSize="12" textAnchor="middle">HPT</text>

                {/* LPT (Low Pressure Turbine) */}
                <polygon points="540,160 600,150 600,250 540,240" fill="#818cf8" opacity="0.7" />
                <text x="570" y="270" fill="#818cf8" fontSize="12" textAnchor="middle">LPT</text>

                {/* Tobera (Exhaust Nozzle) */}
                <path d="M 600,150 L 720,170 L 720,230 L 600,250 Z" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                
                {/* Flujo de Aire Animado (Particles) */}
                <circle cx="100" cy="150" r="2" fill="#60a5fa">
                    <animate attributeName="cx" from="80" to="750" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="100" cy="250" r="2" fill="#60a5fa">
                    <animate attributeName="cx" from="80" to="750" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0" dur="2.2s" repeatCount="indefinite" />
                </circle>

                {/* Gradientes Globales */}
                <defs>
                    <linearGradient id="fireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="50%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                </defs>

                {/* Alerta Zero-Day o Crítica (Overlay) */}
                {isAnomalous && (
                    <text x="400" y="50" fill="#ef4444" fontSize="24" fontWeight="bold" textAnchor="middle" style={{ animation: 'pulse 1s infinite' }}>
                        ¡PELIGRO: ANOMALÍA ESTRUCTURAL DETECTADA!
                    </text>
                )}
            </svg>

            {/* Panel de Datos Flotante */}
            <div style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(15, 23, 42, 0.8)', padding: '10px 15px', borderRadius: '8px', border: `1px solid ${strokeColor}55`, backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Fan Speed (RPM)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: rpm < 2000 ? '#ef4444' : '#f8fafc' }}>
                    {rpm.toFixed(0)} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#64748b' }}>rpm</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
            `}} />
        </div>
    );
}
