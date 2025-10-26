const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const videoRoutes = require("./routes/videoRoutes");
const connectDb = require("./config/mongoDb");
const connectCloudinary = require("./config/cloudinary");

dotenv.config();

const app = express();

// Connect DB & Cloudinary
connectDb();
connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/video", videoRoutes);

// Port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
