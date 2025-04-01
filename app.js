const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// 🔗 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 📌 Define Contact Schema
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", ContactSchema);

// ✉️ Configure Nodemailer (Titan Mail SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📩 Contact Form API Endpoint
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // 💾 Save to MongoDB
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    // 📧 Send Confirmation Email
    const mailOptions = {
      from: `"TechAlpha Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank You for Contacting TechAlpha Hub",
      text: `Hello ${name},\n\nThank you for reaching out to us. We have received your message:\n"${message}"\n\nWe'll get back to you soon.\n\nBest regards,\nTechAlpha Hub Team`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Form submitted successfully, and email sent!" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
