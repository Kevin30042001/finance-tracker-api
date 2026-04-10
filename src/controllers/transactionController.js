const pool = require('../db');

const getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error en getTransactions:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createTransaction = async (req, res) => {
  const { type, category, amount, description, date } = req.body;

  // Normalizamos la categoría — primera letra mayúscula, resto minúsculas
  const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, category, amount, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, type, normalizedCategory, amount, description, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en createTransaction:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, category, amount, description, date } = req.body;

  // Normalizamos la categoría igual que en create
  const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET type = $1, category = $2, amount = $3, description = $4, date = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [type, normalizedCategory, amount, description, date, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en updateTransaction:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    res.json({ message: 'Transacción eliminada correctamente' });
  } catch (error) {
    console.error('Error en deleteTransaction:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getSummary = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        type,
        category,
        SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1
       GROUP BY type, category
       ORDER BY type, total DESC`,
      [req.user.id]
    );

    const income = result.rows.filter(row => row.type === 'income');
    const expenses = result.rows.filter(row => row.type === 'expense');

    const totalIncome = income.reduce((sum, row) => sum + parseFloat(row.total), 0);
    const totalExpenses = expenses.reduce((sum, row) => sum + parseFloat(row.total), 0);
    const balance = totalIncome - totalExpenses;

    res.json({ balance, totalIncome, totalExpenses, income, expenses });
  } catch (error) {
    console.error('Error en getSummary:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
};