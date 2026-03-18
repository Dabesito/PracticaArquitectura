import { Router } from 'express';
import {
  obtenerMisNotificaciones,
  obtenerNoLeidas,
  marcarNotificacionLeida,
} from '../controllers/notificacionesControllers';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', verificarToken, obtenerMisNotificaciones);
router.get('/no-leidas', verificarToken, obtenerNoLeidas);
router.put('/:id/leer', verificarToken, marcarNotificacionLeida);

export default router;