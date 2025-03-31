import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import { buildSearchQuery } from "../utils/queryBuilder.js";

export const doctorService = {
  async getAllDoctors(queryParams) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { query, params } = buildSearchQuery(queryParams);
      const result = await client.query(query, params);
      const countResult = await client.query("SELECT COUNT(*) FROM doctors");

      const doctorsWithSlots = await Promise.all(
        result.rows.map(async (doctor) => {

          const userResult = await client.query(
            "SELECT name, profile FROM users WHERE id = $1",
            [doctor.user_id]
          );

          return {
            ...doctor,
            name: userResult.rows[0].name,
            profile: userResult.rows[0].profile,
          };
        })
      );

      await client.query("COMMIT");
      return {
        doctors: doctorsWithSlots,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(queryParams.page) || 1,
        limit: parseInt(queryParams.limit) || 10,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getDoctorById(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      const doctorResult = await client.query(
        `SELECT * FROM doctors WHERE id = $1`,
        [id]
      );
  
      if (doctorResult.rows.length === 0) {
        throw new Error('Doctor not found');
      }
  
      const doctor = doctorResult.rows[0];
  
      const userResult = await client.query(
        `SELECT name, profile FROM users WHERE id = $1`,
        [doctor.user_id]
      );
  
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
  
      const user = userResult.rows[0];
  
      await client.query('COMMIT');
      
      return {
        ...doctor,
        name: user.name,
        profile: user.profile
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async createDoctor(doctorData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const {
        name,
        email,
        password,
        specialty,
        experience,
        qualification,
        location,
        consultation_fee,
        gender,
        start_time,
        end_time,
        booked_slots = {},
        profile,
        rating = 0,
      } = doctorData;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userResult = await client.query(
        "INSERT INTO users (name, email, password, role, profile) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [name, email, hashedPassword, "doctor", profile]
      );

      const doctorResult = await client.query(
        `INSERT INTO doctors 
         (user_id, specialty, experience, qualification, location, consultation_fee, gender, start_time, end_time, booked_slots, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          userResult.rows[0].id,
          specialty,
          experience,
          qualification,
          location,
          consultation_fee,
          gender,
          start_time,
          end_time,
          booked_slots,
          rating,
        ]
      );

      await client.query("COMMIT");
      return doctorResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async updateDoctor(id, updateData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const doctorCheck = await client.query(
        "SELECT user_id FROM doctors WHERE id = $1",
        [id]
      );

      if (doctorCheck.rows.length === 0) {
        throw new Error("Doctor not found");
      }

      const userId = doctorCheck.rows[0].user_id;

      if (updateData.name || updateData.profile) {
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (updateData.name) {
          updateFields.push(`name = $${paramCount}`);
          updateValues.push(updateData.name);
          paramCount++;
        }

        if (updateData.profile) {
          updateFields.push(`profile = $${paramCount}`);
          updateValues.push(updateData.profile);
          paramCount++;
        }

        updateValues.push(userId);

        await client.query(
          `UPDATE users 
           SET ${updateFields.join(", ")}
           WHERE id = $${paramCount}`,
          updateValues
        );
      }

      const result = await client.query(
        `UPDATE doctors 
         SET specialty = COALESCE($1, specialty),
             experience = COALESCE($2, experience),
             qualification = COALESCE($3, qualification),
             location = COALESCE($4, location),
             consultation_fee = COALESCE($5, consultation_fee),
             gender = COALESCE($6, gender),
             start_time = COALESCE($7, start_time),
             end_time = COALESCE($8, end_time),
             booked_slots = COALESCE($9, booked_slots),
             rating = COALESCE($10, rating)
         WHERE id = $11
         RETURNING *`,
        [
          updateData.specialty,
          updateData.experience,
          updateData.qualification,
          updateData.location,
          updateData.consultation_fee,
          updateData.gender,
          updateData.start_time,
          updateData.end_time,
          updateData.booked_slots,
          updateData.rating,
          id,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error("Doctor not found");
      }

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteDoctor(id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        "SELECT user_id FROM doctors WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error("Doctor not found");
      }

      const userId = result.rows[0].user_id;

      await client.query("DELETE FROM doctors WHERE id = $1", [id]);

      await client.query("DELETE FROM users WHERE id = $1", [userId]);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
