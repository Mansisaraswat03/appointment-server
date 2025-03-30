import { doctorService } from '../services/doctor.service.js';

export const doctorController = {
  async getAllDoctors(req, res) {
    try {
      const result = await doctorService.getAllDoctors(req.query);
      res.json({
        success: true,
        data: {
          doctors: result.doctors,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: Math.ceil(result.total / result.limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching doctors',
        error: error.message
      });
    }
  },

  async getDoctorById(req, res) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);
      res.json({
        success: true,
        data: doctor
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  },

  async createDoctor(req, res) {
    try {
      const doctor = await doctorService.createDoctor(req.body);
      res.status(201).json({
        success: true,
        data: doctor,
        message: 'Doctor created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creating doctor',
        error: error.message
      });
    }
  },

  async updateDoctor(req, res) {
    try {
      const doctor = await doctorService.updateDoctor(req.params.id, req.body);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
      res.json({
        success: true,
        data: doctor,
        message: 'Doctor updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error updating doctor',
        error: error.message
      });
    }
  },

  async deleteDoctor(req, res) {
    try {
      await doctorService.deleteDoctor(req.params.id);
      res.json({
        success: true,
        message: 'Doctor deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error deleting doctor',
        error: error.message
      });
    }
  }
};