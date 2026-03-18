import { Router } from 'express';
import { login, registro } from '../controllers/authController';
import { validate } from '../validators/validate';
import { registroSchema, loginSchema } from '../validators/schemas';

const router = Router();

router.post('/registro', validate(registroSchema), registro);
router.post('/login', validate(loginSchema), login);

export default router;