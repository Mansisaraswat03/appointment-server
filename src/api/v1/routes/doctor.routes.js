import express from 'express';
import { doctorController } from '../../../controllers/doctor.controller.js';
import { authenticate, isAdmin } from '../../../middleware/auth.middleware.js';
import { validateDoctorInput } from '../../../middleware/validation.middleware.js';

const router = express.Router();
router.use((req, res, next) => {
    next();
  });
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.post('/', authenticate, isAdmin, validateDoctorInput, doctorController.createDoctor);
router.patch('/:id', authenticate, isAdmin, doctorController.updateDoctor);
router.delete('/:id', authenticate, isAdmin, doctorController.deleteDoctor);

export default router;