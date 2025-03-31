import pool from '../config/database.js';

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'patient',
        profile VARCHAR(255) , 
        fcm_token TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        specialty VARCHAR(255),
        experience INTEGER,
        qualification TEXT,
        rating DECIMAL DEFAULT 0,
        location TEXT,
        consultation_fee DECIMAL,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        start_time TIME,
        end_time TIME,
        booked_slots JSONB DEFAULT '{}'::jsonb
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        doctor_id INTEGER REFERENCES doctors(id),
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(50),
        type VARCHAR(50) CHECK (type IN ('online','hospital')),
        problem TEXT,
        patient_details JSONB,
        booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id),
        cancelled_by INTEGER REFERENCES users(id),
        cancelled_at TIMESTAMP WITH TIME ZONE
      );
    `);

    console.log('All tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();