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
        availability_schedule JSONB,
        consultation_fee DECIMAL,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
      );
    `);

   
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        doctor_id INTEGER REFERENCES doctors(id),
        appointment_date TIMESTAMP,
        status VARCHAR(50),
        type VARCHAR(50),
        problem TEXT,
        patient_details JSONB
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