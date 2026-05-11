import { Response } from 'express';

/**
 * Envía una respuesta exitosa estandarizada.
 * @param res - El objeto de respuesta de Express.
 * @param data - Los datos a enviar en la respuesta.
 * @param status - El código de estado HTTP (por defecto 200).
 */
export const successResponse = (res: Response, data: any, status: number = 200): void => {
  res.status(status).json({
    success: true,
    data,
  });
};

/**
 * Envía una respuesta de error estandarizada.
 * @param res - El objeto de respuesta de Express.
 * @param error - El mensaje de error principal.
 * @param status - El código de estado HTTP (por defecto 500).
 * @param details - Detalles adicionales del error para depuración.
 */
export const errorResponse = (res: Response, error: string, status: number = 500, details: any = null): void => {
  res.status(status).json({
    success: false,
    error,
    ...(details && { details }),
  });
};
