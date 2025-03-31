import { db } from '../config/firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { sendNotification } from '../config/firebase-admin.js';

export const sendAppointmentConfirmationEmail = async (appointmentData) => {
  try {
    const { patient_email, doctor_name, appointment_date, appointment_time, fcm_token } = appointmentData;
    
    const emailTemplate = {
      to: patient_email,
      message: {
        subject: 'Appointment Confirmation',
        html: `
          <h2>Appointment Confirmation</h2>
          <p>Dear Patient,</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <ul>
            <li>Doctor: ${doctor_name}</li>
            <li>Date: ${appointment_date}</li>
            <li>Time: ${appointment_time}</li>
          </ul>
          <p>Please arrive 15 minutes before your scheduled appointment time.</p>
          <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
          <p>Best regards,<br>MedCare Team</p>
        `
      }
    };

    await addDoc(collection(db, 'emails'), emailTemplate);
    
    if (fcm_token) {
      await sendNotification(
        fcm_token,
        'Appointment Confirmed',
        `Your appointment with Dr. ${doctor_name} is confirmed for ${appointment_date} at ${appointment_time}`,
        {
          type: 'appointment_confirmation',
          appointment_id: appointmentData.id,
          doctor_name,
          appointment_date,
          appointment_time
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 

export const sendAppointmentCancellationEmail = async (appointmentData) => {
  try {
    const { patient_email, doctor_name, appointment_date, appointment_time, fcm_token } = appointmentData;
    
    const emailTemplate = {
      to: patient_email,
      message: {
        subject: 'Appointment Cancellation',
        html: `
          <h2>Appointment Cancellation</h2>
          <p>Dear Patient,</p>
          <p>Your appointment has been cancelled with the following details:</p>
          <ul>
            <li>Doctor: ${doctor_name}</li>
            <li>Date: ${appointment_date}</li>
            <li>Time: ${appointment_time}</li>
          </ul>
          <p>If you would like to reschedule, please book a new appointment.</p>
          <p>Best regards,<br>MedCare Team</p>
        `
      }
    };

    await addDoc(collection(db, 'emails'), emailTemplate);
    
    if (fcm_token) {
      await sendNotification(
        fcm_token,
        'Appointment Cancelled',
        `Your appointment with Dr. ${doctor_name} for ${appointment_date} at ${appointment_time} has been cancelled`,
        {
          type: 'appointment_cancellation',
          appointment_id: appointmentData.id,
          doctor_name,
          appointment_date,
          appointment_time
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
};