import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { Rol } from '@prisma/client';


const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_super_segura';
const JWT_EXPIRES_IN = '24h';

class AuthService {
  async registrar(data: {
    email: string;
    password: string;
    nombre: string;
    rol: string;
  }) {
    const existente = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existente) {
      throw new Error('El email ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const usuario = await prisma.usuario.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nombre: data.nombre,
        rol: data.rol as Rol,
      },
    });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    };
  }

  async login(email: string, password: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      throw new Error('Credenciales inválidas');
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    };
  }
}

export default new AuthService();