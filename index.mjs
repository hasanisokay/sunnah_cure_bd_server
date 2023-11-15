import puppeteer from "puppeteer";
import "dotenv/config";
import jwt from "jsonwebtoken";
import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;

var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-hzckllx-shard-00-00.wvig2d6.mongodb.net:27017,ac-hzckllx-shard-00-01.wvig2d6.mongodb.net:27017,ac-hzckllx-shard-00-02.wvig2d6.mongodb.net:27017/?ssl=true&replicaSet=atlas-sxh7jl-shard-0&authSource=admin&retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// verifying jwt token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};
const adminsCollection = client.db("sukunLife").collection("admins");
const usersCollection = client.db("sukunLife").collection("users");
// todo: verify json token
app.post("/getInfo", verifyJWT, async (req, res) => {
  const email = req.body.email;
  if (req.decoded?.email !== email) {
    res.send({ admin: false });
    return;
  }
  if (req.decoded?.email === email && email === process.env.ADMIN) {
    const result = await usersCollection.find().sort({ date: -1 }).toArray();
    res.send(result);
  }
});

app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;
  if (email !== process.env.ADMIN) {
    res.send({ status: 401, message: "Password or Email is not valid" });
    return;
  } else {
    bcrypt.compare(password, process.env.ADMIN_PASS, (err, result) => {
      if (err) {
        return res.status(401).json({ error: "Invalid email or password" });
      } else if (result) {
        res.send({ status: 200, message: "Success" });
      }
    });
  }
});
app.post("/jwt", async (req, res) => {
  const token = jwt.sign(
    { email: process.env.ADMIN },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  res.send(token);
});

app.post("/saveInfo", async (req, res) => {
  const {
    name,
    address,
    phoneNumber,
    email,
    maritalStatus,
    familyMembersProblem,
  } = req.body;


  await usersCollection.insertOne(req.body);
  // try {
  //   const browser = await puppeteer.connect({
  //     browserWSEndpoint: process.env.BROWSERLESS_URL,
  //   });
  //   const page = await browser.newPage();
  //   await page.goto("https://forms.gle/zXhyHFL7GAP4qrur7", {
  //     waitUntil: "networkidle0",
  //   });
  //   await page.waitForSelector("[role='button']");
  //   await page.type('[aria-labelledby="i1"]', name);
  //   await page.type('[aria-labelledby="i5"]', phoneNumber);
  //   await page.type('[aria-labelledby="i13"]', address);
  //   await page.type('[aria-labelledby="i9"]', email);
  //   await page.type('[aria-labelledby="i17"]', maritalStatus);
  //   await page.type('[aria-labelledby="i21"]', familyMembersProblem);
  //   await page.evaluate(() => {
  //     [...document.querySelectorAll("[role='button']")]
  //       .find(
  //         (btn) =>
  //           btn.innerText == "জমা দিন" ||
  //           btn.innerText == "submit" ||
  //           btn.innerText == "Submit"
  //       )
  //       .click();
  //   });
  //   await page.close();
  //   await browser.close();
  // } catch {}
  res.send({ status: 200, message: "Saved successfully" });
});

app.get("/", (req, res) => {
  res.send("Server running");
});
app.listen(port, () => {
  console.log(`SukunLife sever is running on port ${port}`);
});
