import app from './app';
import prisma from './config/database';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try {
        // Verificar conexión a base de datos
        await prisma.$connect();
        console.log('✅ Conexión a base de datos exitosa.');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor Monolito corriendo en puerto ${PORT}`);
            console.log(`🏥 Health: http://localhost:${PORT}/health`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar:', error);
        process.exit(1);
    }
};

// Graceful shutdown (Cierre limpio)
process.on('SIGINT', async () => {
    console.log('🛑 SIGINT recibido, cerrando...');
    await prisma.$disconnect();
    process.exit(0);
});

startServer();