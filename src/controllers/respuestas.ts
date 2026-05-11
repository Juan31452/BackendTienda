import { Response } from 'express';

export const successResponse = (res: Response, data: any, status: number = 200): void => {
  res.status(status).json({
    success: true,
    data,
  });
};

export const errorResponse = (res: Response, error: string, status: number = 500, details: any = null): void => {
  res.status(status).json({
    success: false,
    error,
    ...(details && { details }),
  });
};
