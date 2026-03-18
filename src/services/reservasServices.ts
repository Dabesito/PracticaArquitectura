import prisma from '../config/database';
import notificador from '../utils/notificador';

class ReservasService {
  async crearReserva(data: {
    estudianteId: string;
    tutorId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
  }) {
    // 1. Validar que no se reserve en el pasado
    // Usamos comparación de strings YYYY-MM-DD para evitar problemas de timezone
    // new Date('YYYY-MM-DD') se interpreta como UTC, pero new Date() usa hora local
    const ahora = new Date();
    const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    
    if (data.fecha < hoyStr) {
      throw new Error('No se puede reservar en el pasado');
    }

    // 2. Verificar que el tutor existe
    const tutor = await prisma.tutor.findUnique({
      where: { id: data.tutorId },
      include: { usuario: true },
    });
    
    if (!tutor) {
      throw new Error('Tutor no encontrado');
    }

    // 3. Verificar que no hay doble reserva en el mismo horario
    const reservaExistente = await prisma.reserva.findFirst({
      where: {
        tutorId: data.tutorId,
        fecha: new Date(data.fecha),
        estado: 'confirmada',
        OR: [
          {
            AND: [
              { horaInicio: { lte: data.horaInicio } },
              { horaFin: { gt: data.horaInicio } },
            ],
          },
          {
            AND: [
              { horaInicio: { lt: data.horaFin } },
              { horaFin: { gte: data.horaFin } },
            ],
          },
          {
            AND: [
              { horaInicio: { gte: data.horaInicio } },
              { horaFin: { lte: data.horaFin } },
            ],
          },
        ],
      },
    });

    if (reservaExistente) {
      throw new Error('El tutor ya tiene una reserva en ese horario');
    }

    // 4. Verificar disponibilidad del tutor
    // Parseamos la fecha manualmente para evitar problemas de timezone
    const [anio, mes, dia] = data.fecha.split('-').map(Number);
    const fechaLocal = new Date(anio, mes - 1, dia);
    const diaSemana = fechaLocal.getDay() || 7; // 0=Domingo -> 7
    
    const disponibilidad = await prisma.disponibilidad.findFirst({
      where: {
        tutorId: data.tutorId,
        diaSemana: diaSemana,
        activo: true,
        horaInicio: { lte: data.horaInicio },
        horaFin: { gte: data.horaFin },
      },
    });

    if (!disponibilidad) {
      throw new Error('El tutor no está disponible en ese horario');
    }

    // 5. Crear la reserva
    const reserva = await prisma.reserva.create({
      data: {
        estudianteId: data.estudianteId,
        tutorId: data.tutorId,
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        estado: 'confirmada',
      },
    });

    // 6. Notificar (fire and forget, sin acoplar dominio)
    notificador.enviarNotificacion(
      'email',
      data.estudianteId,
      'Reserva confirmada',
      `Tu reserva con ${tutor.usuario.nombre} para el ${data.fecha} a las ${data.horaInicio} ha sido confirmada`
    );

    return reserva;
  }

  async cancelarReserva(reservaId: string, usuarioId: string) {
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      throw new Error('Reserva no encontrada');
    }

    if (
      reserva.estudianteId !== usuarioId &&
      reserva.tutorId !== usuarioId
    ) {
      throw new Error('No tienes permisos para cancelar esta reserva');
    }

    if (reserva.estado === 'cancelada') {
      throw new Error('La reserva ya está cancelada');
    }

    // Calcular si aplica penalización (<24h)
    const ahora = new Date();
    const fechaReserva = new Date(reserva.fecha);
    const [horas, minutos] = reserva.horaInicio.split(':').map(Number);
    fechaReserva.setHours(horas, minutos, 0, 0);
    
    const horasHastaReserva =
      (fechaReserva.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    let penaltyReason: string | null = null;
    let penaltyFee: number | null = null;

    if (horasHastaReserva < 24 && horasHastaReserva > 0) {
      penaltyReason = 'Cancelación con menos de 24 horas de anticipación';
      penaltyFee = 10.0; // Penalización fija de $10
    }

    const reservaActualizada = await prisma.reserva.update({
      where: { id: reservaId },
      data: {
        estado: 'cancelada',
        penaltyReason,
        penaltyFee,
      },
    });

    // Notificar
    const mensajePenalizacion = penaltyReason
      ? `\nPenalización aplicada: $${penaltyFee} - ${penaltyReason}`
      : '';
      
    notificador.enviarNotificacion(
      'email',
      reserva.estudianteId,
      'Reserva cancelada',
      `Tu reserva ha sido cancelada.${mensajePenalizacion}`
    );

    return reservaActualizada;
  }

  async listarReservasPorUsuario(id: string, rol: string) {
    const where =
      rol === 'estudiante'
        ? { estudianteId: id }
        : { tutorId: id };

    return prisma.reserva.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        estudiante: {
          select: { id: true, nombre: true, email: true },
        },
        tutor: {
          include: {
            usuario: {
              select: { id: true, nombre: true, email: true },
            },
          },
        },
      },
    });
  }
}

export default new ReservasService();