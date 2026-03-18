import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_super_segura';

export interface AuthRequest extends Request {
  usuario?: {
    id: string;
    email: string;
    rol: string;
  };
}

export const verificarToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticación requerido' });
      return;
    }

    const token = authHeader.split(' ')[1]; // Eliminar "Bearer "

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      rol: string;
    };

    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const verificarRol = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      res.status(403).json({ error: 'No tienes permisos para esta acción' });
      return;
    }

    next();
  };
};
