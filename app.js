const express = require("express");
const cors = require("cors");
const env = require("dotenv").config();
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ limit: '50mb', extended: true }));

const allowedOrigins = process.env.ALLOWEDORIGINS ? process.env.ALLOWEDORIGINS.split(',') : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Use the routes defined in routes.js
app.use("/", routes);

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});
