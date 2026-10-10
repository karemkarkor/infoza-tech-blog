const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

async function requireAuth(req, res, next) {
  const token = req.cookies?.blog_session;
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true }
    });
    if (!user) return res.status(401).json({ error: 'Your session is no longer valid.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
}

module.exports = { requireAuth };
