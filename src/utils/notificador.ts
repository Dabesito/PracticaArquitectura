/**
 * Notificador Simulado - Adapter/Port pattern
 * En producción, esto se reemplazaría por un servicio real de email/SMS
 */

export interface Notificacion {
  id: number;
  tipo: string;
  destinatario: string;
  asunto: string;
  mensaje: string;
  fechaEnvio: Date;
  leida: boolean;
}

class NotificadorSimulado {
  private historial: Notificacion[] = [];
  private idCounter = 0;

  enviarNotificacion(
    tipo: string,
    destinatario: string,
    asunto: string,
    mensaje: string
  ): Notificacion {
    const notificacion: Notificacion = {
      id: ++this.idCounter,
      tipo,
      destinatario,
      asunto,
      mensaje,
      fechaEnvio: new Date(),
      leida: false,
    };

    this.historial.push(notificacion);

    console.log(`📧 [${tipo.toUpperCase()}] Para: ${destinatario}`);
    console.log(`   Asunto: ${asunto}`);
    console.log(`   Mensaje: ${mensaje}`);
    console.log(`   Fecha: ${notificacion.fechaEnvio.toISOString()}`);

    return notificacion;
  }

  obtenerHistorial(): Notificacion[] {
    return [...this.historial];
  }

  obtenerPorUsuario(usuarioId: string): Notificacion[] {
    return this.historial.filter((n) => n.destinatario === usuarioId);
  }

  marcarLeida(notificacionId: number): boolean {
    const notificacion = this.historial.find((n) => n.id === notificacionId);
    if (notificacion) {
      notificacion.leida = true;
      return true;
    }
    return false;
  }

  obtenerNoLeidas(usuarioId: string): Notificacion[] {
    return this.historial.filter(
      (n) => n.destinatario === usuarioId && !n.leida
    );
  }
}

const notificador = new NotificadorSimulado();
export default notificador;