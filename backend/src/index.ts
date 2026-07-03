// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { sequelize, User } from "./models";

// Import routes
import authRoutes from "./routes/auth";
import complaintRoutes from "./routes/complaints";
import noticeRoutes from "./routes/notices";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notices", noticeRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
});

const start = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("Database connected and synced");
    const admin = await User.findOne({ where: { role: "admin" } });
    if (!admin) {
      await User.create({
        name: "Admin",
        email: "admin@society.com",
        password: "admin123",
        role: "admin",
      });
      console.log("Default admin created: admin@society.com / admin123");
      console.log(
        "IMPORTANT: Change the default admin password after first login."
      );
    }

    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `Email configured: ${process.env.EMAIL_USER ? "yes" : "no, using Ethereal preview"}`
    );
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

start();
