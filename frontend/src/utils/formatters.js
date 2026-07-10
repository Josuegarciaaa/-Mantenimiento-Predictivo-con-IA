/**
 * utils/formatters.js
 * ===================
 * Funciones de formateo para el frontend.
 */

// Implementation pending

export const formatRUL = (rul, t) => {
    if (t) return `${Math.round(rul)} ${t('dashboard.cycles')}`;
    return `${Math.round(rul)} ciclos`;
};
export const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;
export const formatDate = (date, locale = 'en-US') => new Date(date).toLocaleDateString(locale);
