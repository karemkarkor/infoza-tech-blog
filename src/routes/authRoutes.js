const express = require('express');
const { register, login, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', (req, res, next) => {
  if (!req.cookies?.blog_session) return res.json({ user: null });
  requireAuth(req, res, next);
}, me);

module.exports = router;
