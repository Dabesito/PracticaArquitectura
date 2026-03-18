import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import tutoresRoutes from './routes/tutoresRoutes';
import disponibilidadRoutes from './routes/disponibilidadRoutes';
import reservasRoutes from './routes/reservasRoutes';
import notificacionesRoutes from './routes/notificacionesRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'tutorias-monolito',
        timestamp: new Date().toISOString(),
    });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/tutores', tutoresRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// Error handler global
app.use(errorHandler);

export default app;