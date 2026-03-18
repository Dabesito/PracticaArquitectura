import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';

export const listarTutores = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { materia } = req.query;

    const tutores = await prisma.tutor.findMany({
      where: materia ? { materias: { has: materia as string } } : undefined,
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    res.status(200).json(tutores);
  } catch (error) {
    console.error('Error al listar tutores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearPerfilTutor = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.usuario!.id;

    const existente = await prisma.tutor.findUnique({
      where: { id: userId },
    });

    if (existente) {
      res.status(409).json({ error: 'Ya tienes un perfil de tutor' });
      return;
    }

    const tutor = await prisma.tutor.create({
      data: {
        id: userId,
        materias: req.body.materias,
        tarifaHora: req.body.tarifaHora,
        biografia: req.body.biografia,
      },
    });

    res.status(201).json(tutor);
  } catch (error) {
    console.error('Error al crear perfil tutor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const obtenerTutor = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const tutor = await prisma.tutor.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        disponibilidades: {
          where: { activo: true },
        },
      },
    });

    if (!tutor) {
      res.status(404).json({ error: 'Tutor no encontrado' });
      return;
    }

    res.status(200).json(tutor);
  } catch (error) {
    console.error('Error al obtener tutor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};