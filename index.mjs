import "dotenv/config";
// require('dotenv').config();
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
import formatDate from "./formatDate.mjs";
import getServiceName from "./getServiceName.mjs";
const app = express();

app.use(cookieParser());
// const corsOptions = {
//   origin: "https://sukunlife.com",
//   // origin: "http://localhost:5173",
//   credentials: true,
// };
// app.use(cors(corsOptions));

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ["http://localhost:5173", "https://sunnahcurebd.netlify.app", "https://test.sunnahcurebd.com/"];

    // Check if the origin is in the allowed list or if there's no origin (for internal requests)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true); // Allow the origin
    } else {
      console.log(`Blocked by CORS: ${origin}`); // Log blocked origin for debugging
      callback(new Error("Not allowed by CORS"), false); // Reject other origins
    }
  },
  credentials: true, // Allow credentials (cookies, authentication, etc.)
};

app.use(cors(corsOptions));

app.use(express.json());
const port = process.env.PORT || 3000;
// console.log(process.env.DB_USER)
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vp5x6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vp5x6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  let token = req?.cookies?.jwt;
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!token) {
    const cookies = cookieHeader?.split(";").reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = value;
      return cookies;
    }, {});
    token = cookies;
  }
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie("jwt");
    return res.status(401).json({ message: "Unauthorized" });
  }
};

app.get("/check-auth", verifyToken, (req, res) => {
  return res.status(200).json({ message: "Authenticated" });
});

app.post("/sendEmail", async (req, res) => {
  try {
    const { formData } = req.body;

    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_SERVICE_HOST,
      secure: true,
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      to: "sunnahcurebd@gmail.com",
      subject: "New Appointment - Sunnah Cure",
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Appointment</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
              }
              .email-header {
                  background-color: #5a9433;
                  color: #ffffff;
                  text-align: center;
                  padding: 20px;
              }
              .email-header h2 {
                  margin: 0;
              }
              .email-body {
                  padding: 20px;
                  color: #333333;
              }
              .email-body ul {
                  list-style: none;
                  padding: 0;
              }
              .email-body li {
                  margin-bottom: 10px;
                  font-size: 16px;
              }
              .email-body li strong {
                  color: #5a9433;
              }
              .email-footer {
                  background-color: #f4f4f4;
                  text-align: center;
                  padding: 10px;
                  font-size: 14px;
                  color: #666666;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="email-header">
                  <h2>New Appointment Details</h2>
              </div>
              <div class="email-body">
                  <ul>
                      <li><strong>Name:</strong> ${formData.name}</li>
                      <li><strong>Email:</strong> ${formData.email}</li>
                      <li><strong>Phone Number:</strong> ${
                        formData.phoneNumber
                      }</li>
                      <li><strong>Address:</strong> ${formData.address}</li>
                      <li><strong>Service:</strong> ${getServiceName(formData.service)}</li>
                      <li><strong>Date:</strong> ${formatDate(
                        new Date(formData.date)
                      )}</li>
                      <li><strong>Problem:</strong> ${formData.problem}</li>
                  </ul>
              </div>
              <div class="email-footer">
                  © 2025 Sunnah Cure BD. All rights reserved.
              </div>
          </div>
      </body>
      </html>`,
    };

    try {
      const re = await transporter.sendMail(mailOptions);
      if (re?.messageId) {
        res.send({ status: 200, message: "Email sent successfully" });
      } else {
        res.send({ status: 400, message: `Email Not Sent` });
      }
    } catch (error) {
      res.send({ status: 500, message: `Error sending email, ${error}` });
    }
  } catch {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

const usersCollection = client.db("sunnah_cure_test_app").collection("users");
const adminCollection = client.db("sunnah_cure_test_app").collection("admin");

app.get("/getInfo", verifyToken, async (req, res) => {
  try {
    const result = await usersCollection.find().sort({ date: -1 }).toArray();
    return res.send(result);
  } catch {
    return res.status(500).send({ message: "Internal Server Error" });
  }
});
app.get("/logout", async (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.status(200).json({ message: "success to logout" });
  } catch {
    return res.status(500).send({ message: "Internal Server Error" });
  }
});
app.get("/clear-data", verifyToken, async (req, res) => {
  try {
    const result = await usersCollection.deleteMany({});
    return res.status(200).send(result);
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred while clearing data.");
  }
});

app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await adminCollection.findOne({ email });
    if (!admin) {
      return res.status(401).send({ message: "Email not found", status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (isPasswordValid) {
      res.status(200).send({ message: "Success", status: 200 });
    } else {
      res.status(401).send({ message: "Invalid password", status: 401 });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "Internal Server Error", status: 500 });
  }
});
app.post("/admin-password-change", verifyToken, async (req, res) => {
  let email;
  const { currentPassword, newPassword } = req.body;
  // console.log(req.user);
  if (req?.user) {
    email = req?.user?.email;
  }
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).send({
      message: "All fields (email, currentPassword, newPassword) are required",
      status: 400,
    });
  }

  try {
    const admin = await adminCollection.findOne({ email });
    if (!admin) {
      return res.status(401).send({ message: "User not found", status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin?.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .send({ message: "Invalid current password", status: 401 });
    }
    if (newPassword.length < 6) {
      return res.status(400).send({
        message: "New password must be at least 8 characters long",
        status: 400,
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await adminCollection.updateOne(
      { email },
      { $set: { password: hashedNewPassword } }
    );

    res
      .status(200)
      .send({ message: "Password successfully changed", status: 200 });
  } catch (error) {
    console.error("Error during password change:", error);
    res.status(500).send({ message: "Internal Server Error", status: 500 });
  }
});

app.post("/jwt", async (req, res) => {
  try {
    const token = jwt.sign(
      { email: req?.body?.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none",
    });
    res.status(200).send({ message: "Authorized", status: 200 });
    // res.sendStatus(200);
  } catch {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.post("/saveInfo", async (req, res) => {
  try {
    console.log(req.body);
    const result = await usersCollection.insertOne(req.body);
    if (result.acknowledged) {
      res.send({ status: 200, message: "Saved successfully" });
    } else {
      res.status(400).send({ message: "Could Not save." });
    }
  } catch (e) {
    // console.log(e)
    res.status(500).send({ message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Server running");
});
app.listen(port, () => {
  console.log(`SunnahCureBd sever is running on port ${port}`);
});
