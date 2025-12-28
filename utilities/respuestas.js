/**
 * Envía una respuesta exitosa estandarizada.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 * @param {object} data - Los datos a enviar en la respuesta.
 * @param {number} [status=200] - El código de estado HTTP.
 */
export const successResponse = (res, data, status = 200) => {
  res.status(status).json({
    success: true,
    data,
  });
};

/**
 * Envía una respuesta de error estandarizada.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 * @param {string} error - El mensaje de error principal.
 * @param {number} [status=500] - El código de estado HTTP.
 * @param {string|object|null} [details=null] - Detalles adicionales del error.
 */
export const errorResponse = (res, error, status = 500, details = null) => {
  res.status(status).json({
    success: false,
    error,
    ...(details && { details }),
  });
};
