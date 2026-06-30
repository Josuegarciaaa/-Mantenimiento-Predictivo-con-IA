/**
 * response.js
 * ============
 * Utilidades para formatear respuestas de la API.
 */

const successResponse = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data
    });
};

const errorResponse = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        error: { message }
    });
};

const paginatedResponse = (res, data, page, limit, total) => {
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
