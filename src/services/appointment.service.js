import pool from "../config/database.js";
import {
  sendAppointmentCancellationEmail,
  sendAppointmentConfirmationEmail,
} from "../utils/emailService.js";

export const createAppointment = async (appointmentData) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const appointmentDate = new Date(appointmentData.appointment_date);
    const existingSlots = await client.query(
      `SELECT booked_slots FROM doctors WHERE id = $1`,
      [appointmentData.doctor_id]
    );

    const bookedSlots = existingSlots.rows[0].booked_slots || {};
    const dateKey = appointmentDate.toISOString().split("T")[0];
    const timeSlot = appointmentData.appointment_time;

    if (bookedSlots[dateKey]?.includes(timeSlot)) {
      throw new Error("This time slot is already booked");
    }

    const appointmentResult = await client.query(
      `INSERT INTO appointments (
        patient_id, 
        doctor_id, 
        appointment_date, 
        appointment_time,
        status,
        type,
        problem,
        patient_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        appointmentData.patient_id,
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time,
        "pending",
        appointmentData.type,
        appointmentData.problem,
        appointmentData.patient_details,
      ]
    );

    const updatedSlots = {
      ...bookedSlots,
      [dateKey]: [...(bookedSlots[dateKey] || []), timeSlot],
    };

    await client.query(
      `UPDATE doctors 
       SET booked_slots = $1 
       WHERE id = $2`,
      [updatedSlots, appointmentData.doctor_id]
    );

    await client.query("COMMIT");
    return appointmentResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// export const getAllAppointments = async (filters = {}) => {
//   const client = await pool.connect();
//   try {
//     let query = `
//       SELECT a.*, 
//              u.name as patient_name,
//              u.email as patient_email,
//              d.specialty as doctor_specialty,
//              doc.name as doctor_name
//       FROM appointments a
//       JOIN users u ON a.patient_id = u.id
//       JOIN doctors d ON a.doctor_id = d.id
//       JOIN users doc ON d.user_id = doc.id
//       WHERE 1=1
//     `;
//     const params = [];

//     if (filters.status) {
//       query += ` AND a.status = $${params.length + 1}`;
//       params.push(filters.status);
//     }

//     if (filters.date) {
//       query += ` AND a.appointment_date = $${params.length + 1}`;
//       params.push(filters.date);
//     }

//     query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

//     const result = await client.query(query, params);
//     return result.rows;
//   } finally {
//     client.release();
//   }
// };

export const getAllAppointments = async (filters = {}) => {
  const client = await pool.connect();
  try {
    let query = `
      SELECT a.*, 
             u.name as patient_name,
             u.email as patient_email,
             d.specialty as doctor_specialty,
             doc.name as doctor_name
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc ON d.user_id = doc.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ` AND a.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters.date) {
      query += ` AND a.appointment_date = $${params.length + 1}`;
      params.push(filters.date);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    const result = await client.query(query, params);
    
    const now = new Date();
    const appointments = result.rows.reduce((acc, appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentTime = appointment.appointment_time.split(':');
      
      appointmentDate.setHours(parseInt(appointmentTime[0]));
      appointmentDate.setMinutes(parseInt(appointmentTime[1]));
      appointmentDate.setSeconds(0);
      appointmentDate.setMilliseconds(0);

      if (appointmentDate < now) {
        acc.past.push(appointment);
      } else {
        acc.upcoming.push(appointment);
      }
      
      return acc;
    }, { past: [], upcoming: [] });

    return {
      past: appointments.past,
      upcoming: appointments.upcoming,
      total: result.rows.length
    };
  } finally {
    client.release();
  }
};


export const updateAppointmentStatus = async (id, status, updated_by) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const appointmentResult = await client.query(
      `SELECT a.*, u.email as patient_email, doc.name as doctor_name
       FROM appointments a
       JOIN users u ON a.patient_id = u.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       WHERE a.id = $1`,
      [id]
    );

    const appointment = appointmentResult.rows[0];
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const updateResult = await client.query(
      `UPDATE appointments 
       SET status = $1, 
           updated_by = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, updated_by, id]
    );

    if (status === "cancelled") {
      const dateKey = appointment.appointment_date.toISOString().split("T")[0];
      const timeSlot = appointment.appointment_time;

      const doctorResult = await client.query(
        `SELECT booked_slots FROM doctors WHERE id = $1`,
        [appointment.doctor_id]
      );

      const bookedSlots = doctorResult.rows[0].booked_slots;
      if (bookedSlots[dateKey]) {
        bookedSlots[dateKey] = bookedSlots[dateKey].filter(
          (time) => time !== timeSlot
        );
      }

      await client.query(
        `UPDATE doctors 
         SET booked_slots = $1 
         WHERE id = $2`,
        [bookedSlots, appointment.doctor_id]
      );

      await sendAppointmentCancellationEmail({
        patient_email: appointment.patient_email,
        doctor_name: appointment.doctor_name,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        fcm_token: appointment.fcm_token,
        id: appointment.id,
      });
    }

    if (status === "accepted") {
      await sendAppointmentConfirmationEmail({
        patient_email: appointment.patient_email,
        doctor_name: appointment.doctor_name,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
      });
    }

    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getUserAppointments = async (userId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT a.*, 
             d.specialty as doctor_specialty,
             doc.name as doctor_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [userId]
    );

    const appointments = result.rows;
    const now = new Date();

    return {
      past: appointments.filter((apt) => new Date(apt.appointment_date) < now),
      upcoming: appointments.filter(
        (apt) => new Date(apt.appointment_date) >= now
      ),
    };
  } finally {
    client.release();
  }
};
