import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { buildSearchQuery } from '../utils/queryBuilder.js';

export const doctorService = {  
    async getAllDoctors(queryParams) {
      const { query, params } = buildSearchQuery(queryParams);
      const result = await pool.query(query, params);
      const countResult = await pool.query('SELECT COUNT(*) FROM doctors');
      
      const doctorsWithSlots = await Promise.all(
        result.rows.map(async (doctor) => {
          const availableSlots = await this.getNextAvailableSlots(doctor.id);
          return {
            ...doctor,
            availableSlots
          };
        })
      );
      
      return {
        doctors: doctorsWithSlots,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(queryParams.page) || 1,
        limit: parseInt(queryParams.limit) || 10
      };
    },
  
    async getNextAvailableSlots(doctorId) {
      try {
        const result = await pool.query(
          `SELECT availability_schedule 
           FROM doctors 
           WHERE id = $1`,
          [doctorId]
        );
  
        if (result.rows.length === 0) {
          return [];
        }
  
        const availabilitySchedule = result.rows[0].availability_schedule;
        const availableSlots = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          const dayOfWeek = date.getDay();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDay = dayNames[dayOfWeek];
  
          const daySchedule = availabilitySchedule[currentDay];
          if (!daySchedule) continue;
  
          availableSlots.push({
            date: date.toISOString().split('T')[0],
            available: daySchedule.available || [],
            booked: daySchedule.booked || []
          });
        }
  
        return availableSlots;
      } catch (error) {
        console.error('Error getting available slots:', error);
        return [];
      }
    },
  
    async createDoctor(doctorData) {
      const { 
        name, 
        email, 
        password, 
        specialty, 
        experience, 
        qualification, 
        location, 
        consultation_fee, 
        availability_schedule,
        gender 
      } = doctorData;
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const userResult = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, hashedPassword, 'doctor']
      );
  
      const doctorResult = await pool.query(
        `INSERT INTO doctors 
         (user_id, specialty, experience, qualification, location, consultation_fee, availability_schedule, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userResult.rows[0].id, 
          specialty, 
          experience, 
          qualification, 
          location, 
          consultation_fee, 
          availability_schedule,
          gender
        ]
      );
  
      return doctorResult.rows[0];
    },
  
    async updateDoctor(id, updateData) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        if (updateData.name) {
          await client.query(
            `UPDATE users 
             SET name = $1 
             WHERE id = (SELECT user_id FROM doctors WHERE id = $2)`,
            [updateData.name, id]
          );
        }
  
        const result = await client.query(
          `UPDATE doctors 
           SET specialty = COALESCE($1, specialty),
               experience = COALESCE($2, experience),
               qualification = COALESCE($3, qualification),
               location = COALESCE($4, location),
               consultation_fee = COALESCE($5, consultation_fee),
               availability_schedule = COALESCE($6, availability_schedule),
               gender = COALESCE($7, gender)
           WHERE id = $8
           RETURNING *`,
          [
            updateData.specialty,
            updateData.experience,
            updateData.qualification,
            updateData.location,
            updateData.consultation_fee,
            updateData.availability_schedule,
            updateData.gender,
            id
          ]
        );
  
        await client.query('COMMIT');
  
        if (result.rows.length === 0) {
          throw new Error('Doctor not found');
        }
  
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  async deleteDoctor(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      const result = await client.query(
        'SELECT user_id FROM doctors WHERE id = $1',
        [id]
      );
  
      if (result.rows.length === 0) {
        throw new Error('Doctor not found');
      }
  
      const userId = result.rows[0].user_id;
  
      await client.query('DELETE FROM doctors WHERE id = $1', [id]);
  
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};