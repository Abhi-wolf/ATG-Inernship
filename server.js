const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config({
  path: "./config.env",
});
const mongoose = require("mongoose");
const connectDb = require("./config/dbConnection");

// connect to database
connectDb();

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));

app.listen(port, () => {
  console.log(`listening to server on port ${port}`);
});

// otpw jdwo jxkp boop
