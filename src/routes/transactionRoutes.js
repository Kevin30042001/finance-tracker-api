const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
} = require('../controllers/transactionController');

// Todas las rutas de transacciones requieren autenticación
// authMiddleware se ejecuta antes de cada controller
router.get('/summary', authMiddleware, getSummary);
router.get('/', authMiddleware, getTransactions);
router.post('/', authMiddleware, createTransaction);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

module.exports = router;