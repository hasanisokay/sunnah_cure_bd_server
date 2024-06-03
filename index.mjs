import "dotenv/config";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
const app = express();

app.use(cookieParser());
const corsOptions = {
  origin: "https://sukunlife.com",
  // origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
const port = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0jjrt8a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb+srv://sukunlifebd:<password>@cluster0.0jjrt8a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
      to: "sukunlifebd@gmail.com",
      subject: "New Appointment", // Subject line
      html: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Appointment Details</title>
    </head>
    <body>
        <h2>New Appointment Details</h2>
        <ul>
            <li><strong>Name:</strong> ${formData.name}</li>
            <li><strong>Email:</strong> ${formData.email}</li>
            <li><strong>Phone Number:</strong> ${formData.phoneNumber}</li>
            <li><strong>Address:</strong> ${formData.address}</li>
            <li><strong>Service:</strong> ${formData.service}</li>
            <li><strong>Date:</strong> ${formData.date}</li>
            <li><strong>Problem:</strong> ${formData.problem}</li>
        </ul>
    </body>
    </html>`,
    };
    try {
      await transporter.sendMail(mailOptions);
      res.send({ status: 200, message: "Email sent successfully" });
    } catch (error) {
      res.send({ status: 500, message: `Error sending email, ${error}` });
    }
  } catch {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

const usersCollection = client.db("sukunLife").collection("users");

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
  if (email !== process.env.ADMIN) {
    res.send({ status: 401, message: "Password or Email is not valid" });
    return;
  } else {
    try {
      const result = await bcrypt.compare(password, process.env.ADMIN_PASS);
      if (result) {
        res.status(200).send({ message: "Success" });
      } else {
        res.status(401).send({ message: "Invalid password" });
      }
    } catch {
      console.error("Error comparing passwords:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  }
});
app.post("/jwt", async (req, res) => {
  try {
    const token = jwt.sign(
      { email: process.env.ADMIN },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
    });

    res.sendStatus(200);
  } catch {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.post("/saveInfo", async (req, res) => {
  try {
    await usersCollection.insertOne(req.body);
    res.send({ status: 200, message: "Saved successfully" });
  } catch {
    res.status(500).send({ message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Server running");
});
app.listen(port, () => {
  console.log(`SukunLife sever is running on port ${port}`);
});