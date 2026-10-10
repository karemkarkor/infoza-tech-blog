const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '40kb' }));
app.use(cookieParser());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', notFound);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
