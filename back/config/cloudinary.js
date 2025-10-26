const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

const connectCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
    console.log("✅ Cloudinary connected successfully");
  } catch (err) {
    console.error("❌ Cloudinary connection failed:", err.message);
  }
};

module.exports = connectCloudinary;
