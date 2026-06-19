const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      code: 'FORBIDDEN_INSUFFICIENT_ROLE',
      message: 'You do not have permission to perform this action.'
    });
  }
  next();
};

module.exports = { requireRole };
