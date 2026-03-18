import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🔥 Error atrapado por el middleware:', err.message || err);

  const statusCode = err.status || 500;
  const mensaje = err.message || 'Error interno del servidor';

  // Si enviaste detalles extra (como lo hicimos en validate.ts de Zod)
  const detalles = err.details || undefined;

  res.status(statusCode).json({
    error: mensaje,
    detalles: detalles
  });
};