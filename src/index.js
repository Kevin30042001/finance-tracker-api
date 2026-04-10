const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

const allowedOrigins = [
  // URL estable de producción en Vercel — dominio principal del proyecto
  'https://finance-tracker-cunywtj0p-kevins-projects-31ae7e0d.vercel.app',
  // Agrega aquí cualquier otro dominio de Vercel que te genere (preview deployments)
  // Patrón: https://finance-tracker-*.vercel.app
  'http://localhost:5173',
  'http://localhost:4173', // vite preview local
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, Railway health checks, curl)
    if (!origin) return callback(null, true);

    // Verificamos si el origin está en la lista o si es un preview de Vercel del proyecto
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/finance-tracker-.*\.vercel\.app$/.test(origin);

    // Nota: en Express 5 pasar new Error() al callback puede causar un 500 en lugar de 403.
    // Usamos callback(null, false) para rechazar limpiamente sin crashear el servidor.
    if (!isAllowed) console.error(`CORS bloqueado para origen: ${origin}`);
    callback(null, isAllowed ? true : false);
  },
  credentials: true,
}));

app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Ruta de prueba — útil para verificar que Railway levantó el servicio
app.get('/', (req, res) => {
  res.json({ message: 'Finance Tracker API funcionando' });
});

// Railway inyecta PORT automáticamente — nunca hardcodear 8080 o 3000 en producción
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
