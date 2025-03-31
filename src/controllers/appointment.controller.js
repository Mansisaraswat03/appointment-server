import * as appointmentService from '../services/appointment.service.js';

export const createAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.createAppointment({
      ...req.body,
      patient_id: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      date: req.query.date
    };

    const appointments = await appointmentService.getAllAppointments(filters);
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await appointmentService.updateAppointmentStatus(
      id,
      status,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserAppointments = async (req, res) => {
  try {
    const appointments = await appointmentService.getUserAppointments(req.user.id);
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}; 