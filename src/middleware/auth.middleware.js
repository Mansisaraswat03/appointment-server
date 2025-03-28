import passport from 'passport';

export const authenticate = passport.authenticate('jwt', { session: false });

export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};