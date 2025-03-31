import express from "express";
import dotenv from "dotenv";
import v1Routes from "./api/v1/index.js";
import cors from "cors";
dotenv.config();

const app = express();
const allowedOrigins = [process.env.FRONTEND_URL, process.env.ADMIN_URL] || [];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
