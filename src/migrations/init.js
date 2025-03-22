import pool from '../config/database.js';

const createTables = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        auth0_id VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'patient',
        fcm_token TEXT
      );
    `);

    // Create doctors table
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
        is_available BOOLEAN DEFAULT true
      );
    `);

    // Create appointments table
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