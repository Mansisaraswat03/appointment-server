import { validationResult, body } from 'express-validator';

export const validateUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

const isValidEmailDomain = (value) => {
  const allowedDomains = ['gmail.com', 'tothenew.com'];
  const domain = value.split('@')[1];
  return allowedDomains.includes(domain);
};

export const userValidationRules = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail().withMessage('Please enter a valid email')
      .custom(isValidEmailDomain).withMessage('Email must be from @gmail.com or @tothenew.com domain'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one special character'),
    body('role').isIn(['admin', 'doctor', 'patient']).withMessage('Invalid role'),
    validateUser
  ],

  login: [
    body('email')
      .isEmail().withMessage('Please enter a valid email')
      .custom(isValidEmailDomain).withMessage('Email must be from @gmail.com or @tothenew.com domain'),
    body('password').notEmpty().withMessage('Password is required'),
    validateUser
  ],

  updateProfile: [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email')
      .optional()
      .isEmail().withMessage('Please enter a valid email')
      .custom(isValidEmailDomain).withMessage('Email must be from @gmail.com or @tothenew.com domain'),
    body('profile').optional().isURL().withMessage('Profile must be a valid URL'),
    validateUser
  ],

  updatePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one special character'),
    validateUser
  ]
};