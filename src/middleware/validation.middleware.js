export const validateDoctorInput = (req, res, next) => {
    const { body } = req;
    const errors = [];
  
    if (!body.name) errors.push('Name is required');
    if (!body.specialty) errors.push('Specialty is required');
    if (!body.experience) errors.push('Experience is required');
    if (!body.qualification) errors.push('Qualification is required');
    if (!body.location) errors.push('Location is required');
    if (!body.consultation_fee) errors.push('Consultation fee is required');
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
  
    next();
  };