const jwt = require('jsonwebtoken');

const requireCsrf = (req, res, next) => {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const headerToken = req.headers['x-csrf-token'];
  if (!headerToken) return res.status(403).json({ message: 'Missing CSRF token' });
  let claims = req.authClaims;
  if (!claims && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      claims = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Token failed' });
    }
  }
  if (!claims || !claims.csrf) return res.status(403).json({ message: 'CSRF validation failed' });
  if (headerToken !== claims.csrf) return res.status(403).json({ message: 'CSRF token mismatch' });
  next();
};

module.exports = { requireCsrf };
