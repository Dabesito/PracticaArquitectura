import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import notificador from '../utils/notificador';

export const obtenerMisNotificaciones = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.usuario!.id;
    const notificaciones = notificador.obtenerPorUsuario(userId);
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const obtenerNoLeidas = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.usuario!.id;
    const noLeidas = notificador.obtenerNoLeidas(userId);
    res.json({ count: noLeidas.length, notificaciones: noLeidas });
  } catch (error) {
    console.error('Error al obtener notificaciones no leídas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const marcarNotificacionLeida = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const resultado = notificador.marcarLeida(id);

    if (resultado) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Notificación no encontrada' });
    }
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};