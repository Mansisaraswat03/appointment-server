import express from 'express';
import * as appointmentController from '../../../controllers/appointment.controller.js';
import { isAdmin, authenticate } from '../../../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  authenticate,
  appointmentController.createAppointment
);

router.get(
  '/',
  authenticate,
  isAdmin,
  appointmentController.getAllAppointments
);

router.patch(
  '/:id/status',
  authenticate,
  appointmentController.updateAppointmentStatus
);

router.get(
  '/my-appointments',
  authenticate,
  appointmentController.getUserAppointments
);

export default router; 