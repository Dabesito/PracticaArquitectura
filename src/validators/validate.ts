import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validación fallida',
          details: error.errors.map((e) => ({
            campo: e.path.join('.'),
            mensaje: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Parámetros inválidos',
          details: error.errors.map((e) => ({
            campo: e.path.join('.'),
            mensaje: e.message,
          })),
        });
      }
      next(error);
    }
  };
};