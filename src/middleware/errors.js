function notFound(req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { notFound, errorHandler };
