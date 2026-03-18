import { z } from 'zod';

export const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  rol: z.enum(['estudiante', 'tutor'], {
    errorMap: () => ({ message: 'Rol debe ser estudiante o tutor' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const crearTutorSchema = z.object({
  materias: z.array(z.string()).min(1, 'Debe tener al menos una materia'),
  tarifaHora: z.number().positive('La tarifa debe ser positiva'),
  biografia: z.string().optional(),
});

export const crearDisponibilidadSchema = z.object({
  diaSemana: z.number().int().min(1).max(7),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
});

export const crearReservaSchema = z.object({
  tutorId: z.string().uuid('ID de tutor inválido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
});

export const cancelarReservaSchema = z.object({
  id: z.string().uuid('ID de reserva inválido'),
});