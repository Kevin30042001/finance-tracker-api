const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Registro de nuevo usuario
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Verificamos si el email ya existe en la base de datos
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Encriptamos la contraseña antes de guardarla
    // El 10 es el número de "rondas" de encriptación — más alto = más seguro pero más lento
    // Es como el nivel de dificultad para descifrarla si alguien roba la base de datos
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertamos el usuario y retornamos los datos sin la contraseña
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // Generamos el token JWT — es como el "pase de acceso" del usuario
    // Contiene el id y email del usuario, expira en 7 días
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });

  } catch (error) {
    console.error('Error en register:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Inicio de sesión
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscamos el usuario por email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = result.rows[0];

    // Comparamos la contraseña ingresada con la encriptada en la base de datos
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generamos el token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornamos el token y los datos del usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });

  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { register, login };