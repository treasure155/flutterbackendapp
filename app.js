const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const axios = require("axios");
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// 🔗 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 📌 Define Enrollment Schema
const EnrollmentSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  location: String,
  class_type: String,
  gender: String,
  pre_knowledge: String,
  course: String,
  date: { type: Date, default: Date.now },
});

const Enrollment = mongoose.model("Enrollment", EnrollmentSchema);

// 📌 Define Partnering Schema
const PartneringSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
  address: String,
  gender: String,
  reason: String,
  program: String,
  date: { type: Date, default: Date.now },
});

const Partnering = mongoose.model("Partnering", PartneringSchema);

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

// 📩 Enrollment Form API Endpoint
app.post("/register", async (req, res) => {
  const { first_name, last_name, location, class_type, gender, pre_knowledge, course } = req.body;

  if (!first_name || !last_name || !location || !class_type || !gender || !course) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // 💾 Save to MongoDB
    const newEnrollment = new Enrollment({ first_name, last_name, location, class_type, gender, pre_knowledge, course });
    await newEnrollment.save();

    // 📧 Send Confirmation Email
    const mailOptions = {
      from: `TechAlpha Hub <${process.env.EMAIL_USER}>`,
      to: `${first_name.toLowerCase()}${last_name.toLowerCase()}@example.com`, // Placeholder email format, replace as needed
      subject: "TechAlpha Hub Enrollment Confirmation",
      html: `<p>Dear ${first_name},</p>
             <p>Thank you for registering for <strong>${course}</strong> at TechAlpha Academy!</p>
             <p>To proceed, please contact our admin on WhatsApp using the link below:</p>
             <p><a href="https://wa.me/2347066155981">Chat with TechAlpha Academy Admin</a></p>
             <p>Best regards,<br>TechAlpha Hub Team</p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Enrollment successful. Confirmation email sent!" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📩 Partnering Form API Endpoint
app.post("/partnering", async (req, res) => {
  const { first_name, last_name, email, phone, address, gender, reason, program } = req.body;

  if (!first_name || !last_name || !email || !phone || !address || !reason || !program) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // 💾 Save to MongoDB
    const newPartnering = new Partnering({ first_name, last_name, email, phone, address, gender, reason, program });
    await newPartnering.save();

    // 📧 Send Confirmation Email
    const mailOptions = {
      from: `TechAlpha Hub <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank You for Partnering with TechAlpha Hub",
      html: `<p>Hello ${first_name} ${last_name},</p>
             <p>Thank you for expressing interest in partnering with TechAlpha Hub for our "${program}" program. We appreciate your initiative and are excited to explore the potential of working together.</p>
             <p>To proceed, please contact our admin on WhatsApp using the link below:</p>
             <p><a href="https://wa.me/2347066155981">Chat with TechAlpha Hub Admin</a></p>
             <p>Best regards,<br>TechAlpha Hub Team</p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Partnering request submitted successfully, and email sent!" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Server error" });
  }
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

// 📌 Flutterwave Payment API Endpoint
app.post("/payment", async (req, res) => {
  const { amount, email, phone } = req.body;

  if (!amount || !email || !phone) {
    return res.status(400).json({ error: "Amount, email, and phone are required" });
  }

  const payload = {
    tx_ref: `tx-${Date.now()}`, // unique transaction reference
    amount,
    email,
    phone_number: phone,
    currency: "NGN",
    redirect_url: "https://flutterbackendapp.onrender.com/payment/verify", // URL to verify payment
  };

  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/charges?type=payment",
      payload,
      {
        headers: {
          Authorization: `Bearer FLWSECK-cfad455c42a018dc3be2a3e691d09045-195f6da7584vt-X`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ Payment Error:", error);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// 📌 Payment verification endpoint (Flutterwave will redirect to this URL after payment)
app.post("/payment/verify", async (req, res) => {
  const { tx_ref } = req.body;

  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/charges/${tx_ref}/verify`,
      {
        headers: {
          Authorization: `Bearer FLWSECK-cfad455c42a018dc3be2a3e691d09045-195f6da7584vt-X`,
        },
      }
    );

    if (response.data.status === "success") {
      res.json({ message: "Payment verified successfully" });
    } else {
      res.status(400).json({ error: "Payment verification failed" });
    }
  } catch (error) {
    console.error("❌ Payment Verification Error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
