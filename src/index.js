import express from 'express';
import dotenv from 'dotenv';
import v1Routes from './api/v1/index.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/v1', v1Routes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});