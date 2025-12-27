const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const videoRoutes = require("./routes/videoRoutes");
const connectDb = require("./config/mongoDb");
//const connectCloudinary = require("./config/cloudinary");

dotenv.config();
const app = express();

connectDb();
//connectCloudinary();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Static folder for uploads (optional for debugging)
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/video", videoRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
