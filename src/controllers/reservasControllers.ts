import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import reservasService from '../services/reservasServices';

export const crearReserva = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const reserva = await reservasService.crearReserva({
      estudianteId: req.usuario!.id,
      tutorId: req.body.tutorId,
      fecha: req.body.fecha,
      horaInicio: req.body.horaInicio,
      horaFin: req.body.horaFin,
    });
    res.status(201).json(reserva);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listarMisReservas = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const reservas = await reservasService.listarReservasPorUsuario(
      req.usuario!.id,
      req.usuario!.rol
    );
    res.json(reservas);
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const cancelarReserva = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const reserva = await reservasService.cancelarReserva(
      req.params.id,
      req.usuario!.id
    );
    res.json(reserva);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};