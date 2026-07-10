import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

// fix para los iconos de leaflet en react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// coordenadas ficticias de las plantas para los motores
const LOCATIONS = [
    { lat: 40.7128, lng: -74.0060, name: 'New York Facility' }, // USA
    { lat: 51.5074, lng: -0.1278, name: 'London Plant' }, // UK
    { lat: 35.6762, lng: 139.6503, name: 'Tokyo Hub' }, // Japan
    { lat: 25.4215, lng: -100.9950, name: 'Planta Saltillo' }, // Mexico
    { lat: 25.5417, lng: -100.9492, name: 'Planta Ramos' }, // Mexico
    { lat: 48.8566, lng: 2.3522, name: 'Paris Base' }, // France
    { lat: -33.8688, lng: 151.2093, name: 'Sydney Hub' }, // Australia
    { lat: 1.3521, lng: 103.8198, name: 'Singapore Plant' } // Singapore
];

const getCustomIcon = (status, isAnomalous) => {
    let color = '#10b981'; // healthy (emerald)
    let shadowColor = 'rgba(16, 185, 129, 0.4)';
    
    if (status === 'critical' || isAnomalous) {
        color = '#ef4444'; // critical (red)
        shadowColor = 'rgba(239, 68, 68, 0.6)';
    } else if (status === 'warning') {
        color = '#f59e0b'; // warning (amber)
        shadowColor = 'rgba(245, 158, 11, 0.5)';
    } else if (status === 'maintenance') {
        color = '#8b5cf6'; // maintenance (purple)
        shadowColor = 'rgba(139, 92, 246, 0.5)';
    }

    // Modern glowing dot marker
    const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40px" height="40px">
        <circle cx="20" cy="20" r="8" fill="${color}" filter="drop-shadow(0 0 6px ${shadowColor})" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="${color}" stroke-width="2" opacity="0.4" />
    </svg>`;

    const iconUrl = 'data:image/svg+xml;base64,' + btoa(svgIcon);

    return new L.Icon({
        iconUrl: iconUrl,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
        className: isAnomalous ? 'leaflet-marker-radar' : 'leaflet-marker-glow'
    });
};

export default function FleetMap({ engines }) {
    const [engineMarkers, setEngineMarkers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!engines) return;

        // asignar ubicaciones aleatorias o fijas si no tienen
        const markers = engines.map((eng, index) => {
            const loc = LOCATIONS[index % LOCATIONS.length];
            return {
                ...eng,
                lat: loc.lat + (Math.random() - 0.5) * 0.1, // pequena dispersion
                lng: loc.lng + (Math.random() - 0.5) * 0.1,
                plantName: loc.name
            };
        });
        setEngineMarkers(markers);
    }, [engines]);

    return (
        <div style={{ height: '450px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', background: '#09090b' }}>
            <MapContainer center={[25, 10]} zoom={2} style={{ height: '100%', width: '100%', background: '#09090b' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {engineMarkers.map((engine) => {
                    const isAnomalous = engine.status === 'critical' && engine.last_prediction_rul < 15;
                    
                    return (
                        <Marker 
                            key={engine.id} 
                            position={[engine.lat, engine.lng]}
                            icon={getCustomIcon(engine.status, isAnomalous)}
                        >
                            <Popup>
                                <div style={{ minWidth: '200px', fontFamily: 'Inter', color: '#e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.5px' }}>{engine.name}</h4>
                                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        {engine.plantName}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <strong style={{ color: '#cbd5e1' }}>status:</strong>
                                        <span style={{ 
                                            background: engine.status === 'healthy' ? 'rgba(16,185,129,0.15)' : 
                                                        engine.status === 'warning' ? 'rgba(245,158,11,0.15)' : 
                                                        engine.status === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)',
                                            color: engine.status === 'healthy' ? '#4ade80' : 
                                                   engine.status === 'warning' ? '#fbbf24' : 
                                                   engine.status === 'critical' ? '#f87171' : '#a78bfa',
                                            textTransform: 'uppercase',
                                            fontWeight: '700',
                                            fontSize: '10px',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            letterSpacing: '1px'
                                        }}>
                                            {engine.status}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                        <strong style={{ color: '#cbd5e1' }}>rul:</strong>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f8fafc' }}>
                                            {engine.last_prediction_rul ?? '--'}
                                        </span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => navigate(`/engines/${engine.id}`)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 0',
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            fontSize: '12px'
                                        }}
                                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                    >
                                        ver detalles
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            <style dangerouslySetInnerHTML={{__html: `
                .leaflet-marker-radar {
                    animation: radar-pulse 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
                }
                .leaflet-marker-glow {
                    transition: transform 0.3s ease;
                }
                .leaflet-marker-glow:hover {
                    transform: scale(1.2) !important;
                }
                @keyframes radar-pulse {
                    0% { transform: scale(0.95); opacity: 1; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8)); }
                    50% { transform: scale(1.5); opacity: 0.5; filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.4)); }
                    100% { transform: scale(0.95); opacity: 1; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8)); }
                }
                .leaflet-popup-content-wrapper {
                    background: rgba(15, 23, 42, 0.85) !important;
                    backdrop-filter: blur(12px) !important;
                    -webkit-backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(139, 92, 246, 0.3) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5) !important;
                }
                .leaflet-popup-tip {
                    background: rgba(15, 23, 42, 0.85) !important;
                    border-top: 1px solid rgba(139, 92, 246, 0.3);
                    border-left: 1px solid rgba(139, 92, 246, 0.3);
                }
                .leaflet-popup-close-button {
                    color: #94a3b8 !important;
                    padding: 8px !important;
                }
            `}} />
        </div>
    );
}
