require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in environment variables");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("......MongoDB connected........."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Basic health check route
app.get("/", (req, res) => {
  res.json({ message: "LeetBuddy API is running!" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});