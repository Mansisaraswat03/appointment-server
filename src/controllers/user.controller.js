import { userService } from '../services/user.service.js';

export const userController = {
  async getAllUsers(req, res) {
    try {
      const result = await userService.getAllUsers(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};