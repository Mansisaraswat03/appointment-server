import express from "express";
import dotenv from "dotenv";
import v1Routes from "./api/v1/index.js";
import cors from "cors";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL||"http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/v1", v1Routes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
