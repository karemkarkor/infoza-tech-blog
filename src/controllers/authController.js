const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});

function issueSession(res, userId) {
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: userId, expiresIn: '7d' });
  res.cookie('blog_session', token, cookieOptions());
}

async function register(req, res, next) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
      select: { id: true, name: true, email: true }
    });
    issueSession(res, user.id);
    res.status(201).json({ user });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    issueSession(res, user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
}

function logout(req, res) {
  res.clearCookie('blog_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.json({ message: 'Logged out.' });
}

function me(req, res) {
  res.json({ user: req.user || null });
}

module.exports = { register, login, logout, me };
