/**
 * utils/formatters.js
 * ===================
 * Funciones de formateo para el frontend.
 */

// Implementation pending

export const formatRUL = (rul) => `${Math.round(rul)} ciclos`;
export const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;
export const formatDate = (date) => new Date(date).toLocaleDateString('es-MX');
