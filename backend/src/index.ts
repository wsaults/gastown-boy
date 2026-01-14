import cors from "cors";
import express from "express";
import { agentsRouter, mailRouter, powerRouter, statusRouter, tunnelRouter } from "./routes/index.js";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/agents", agentsRouter);
app.use("/api/mail", mailRouter);
app.use("/api/power", powerRouter);
app.use("/api/status", statusRouter);
app.use("/api/tunnel", tunnelRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
