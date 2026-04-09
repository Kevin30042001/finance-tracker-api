const jwt = require('jsonwebtoken');

// Este middleware protege las rutas que requieren autenticación
// Funciona igual que verificar el token de Firebase en Android —
// si el token no es válido, la petición no pasa
const authMiddleware = (req, res, next) => {

  // El token viene en el header Authorization con el formato: "Bearer el_token_aqui"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado — token no proporcionado' });
  }

  try {
    // Verificamos que el token sea válido y no haya expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos los datos del usuario en req.user para usarlos en los controllers
    req.user = decoded;

    // next() le dice a Express que continúe con el siguiente paso (el controller)
    next();

  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;