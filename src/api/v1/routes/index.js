import express from "express";
import userRoutes from "./user.routes.js";
import doctorRoutes from "./doctor.routes.js";
import appointmentRoutes from "./appointment.routes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/doctors", doctorRoutes);
router.use("/appointments", appointmentRoutes);

export default router;
