import request from 'supertest';
import app from '../app';
import prisma from '../config/database';
import bcrypt from 'bcrypt';

// Test database setup
beforeAll(async () => {
  // Limpiar tablas en orden correcto (por FK)
  await prisma.reserva.deleteMany();
  await prisma.disponibilidad.deleteMany();
  await prisma.tutor.deleteMany();
  await prisma.usuario.deleteMany();
});

afterAll(async () => {
  await prisma.reserva.deleteMany();
  await prisma.disponibilidad.deleteMany();
  await prisma.tutor.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.$disconnect();
});

let estudianteToken: string;
let tutorToken: string;
let estudianteId: string;
let tutorId: string;

describe('Auth Endpoints', () => {
  // Test 1: Registro de estudiante
  it('POST /api/auth/registro - debe registrar un estudiante', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      email: 'test_student@test.com',
      password: 'password123',
      nombre: 'Estudiante Test',
      rol: 'estudiante',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario).toHaveProperty('id');
    expect(res.body.usuario.rol).toBe('estudiante');
    estudianteToken = res.body.token;
    estudianteId = res.body.usuario.id;
  });

  // Test 2: Registro de tutor
  it('POST /api/auth/registro - debe registrar un tutor', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      email: 'test_tutor@test.com',
      password: 'password123',
      nombre: 'Tutor Test',
      rol: 'tutor',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.rol).toBe('tutor');
    tutorToken = res.body.token;
    tutorId = res.body.usuario.id;
  });

  // Test 3: Login exitoso
  it('POST /api/auth/login - debe autenticar con credenciales correctas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test_student@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.email).toBe('test_student@test.com');
  });

  // Test 4: Login fallido
  it('POST /api/auth/login - debe rechazar credenciales incorrectas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test_student@test.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // Test 5: Validación zod en registro
  it('POST /api/auth/registro - debe rechazar datos inválidos (zod)', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      email: 'invalid-email',
      password: '12',
      nombre: '',
      rol: 'admin',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validación fallida');
    expect(res.body.details).toBeInstanceOf(Array);
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});

describe('Tutores Endpoints', () => {
  // Test 6: Crear perfil de tutor
  it('POST /api/tutores - tutor crea su perfil', async () => {
    const res = await request(app)
      .post('/api/tutores')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        materias: ['Matemáticas', 'Cálculo'],
        tarifaHora: 25,
        biografia: 'Profesor con 10 años de experiencia',
      });

    expect(res.status).toBe(201);
    expect(res.body.materias).toContain('Matemáticas');
  });

  // Test 7: Listar tutores
  it('GET /api/tutores - debe listar tutores', async () => {
    const res = await request(app)
      .get('/api/tutores')
      .set('Authorization', `Bearer ${estudianteToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('Disponibilidad Endpoints', () => {
  // Test 8: Crear disponibilidad
  it('POST /api/disponibilidad - tutor crea disponibilidad', async () => {
    const res = await request(app)
      .post('/api/disponibilidad')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        diaSemana: 1,
        horaInicio: '08:00',
        horaFin: '12:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.diaSemana).toBe(1);
  });
});

describe('Reservas Endpoints - Reglas de Negocio', () => {
  // Test 9: Crear reserva exitosa
  it('POST /api/reservas - debe crear reserva válida', async () => {
    // Calcular próximo lunes
    const hoy = new Date();
    const diasHastaLunes = ((1 - hoy.getDay() + 7) % 7) || 7;
    const proximoLunes = new Date(hoy);
    proximoLunes.setDate(hoy.getDate() + diasHastaLunes);
    const fecha = proximoLunes.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${estudianteToken}`)
      .send({
        tutorId,
        fecha,
        horaInicio: '09:00',
        horaFin: '10:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('confirmada');
  });

  // Test 10: No se puede reservar en el pasado (invariante de negocio)
  it('POST /api/reservas - NO debe permitir reservar en el pasado', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${estudianteToken}`)
      .send({
        tutorId,
        fecha: '2020-01-01',
        horaInicio: '09:00',
        horaFin: '10:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pasado/i);
  });

  // Test 11: No se puede doble reserva en mismo horario (invariante)
  it('POST /api/reservas - NO debe permitir doble reserva en mismo horario', async () => {
    const hoy = new Date();
    const diasHastaLunes = ((1 - hoy.getDay() + 7) % 7) || 7;
    const proximoLunes = new Date(hoy);
    proximoLunes.setDate(hoy.getDate() + diasHastaLunes);
    const fecha = proximoLunes.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${estudianteToken}`)
      .send({
        tutorId,
        fecha,
        horaInicio: '09:00',
        horaFin: '10:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya tiene una reserva/i);
  });

  // Test 12: Listar mis reservas
  it('GET /api/reservas/mis-reservas - debe listar reservas del usuario', async () => {
    const res = await request(app)
      .get('/api/reservas/mis-reservas')
      .set('Authorization', `Bearer ${estudianteToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('Health Check', () => {
  // Test 13: Health endpoint
  it('GET /health - debe responder ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Seguridad', () => {
  // Test 14: Acceso sin token denegado
  it('GET /api/tutores - debe rechazar sin token', async () => {
    const res = await request(app).get('/api/tutores');
    expect(res.status).toBe(401);
  });
});
