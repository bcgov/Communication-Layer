const express = require("express");
const cors = require("cors");
const env = require("dotenv").config();
const routes = require("./routes");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());

app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Serve Swagger UI at `/api-docs`
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const allowedOrigins = process.env.ALLOWEDORIGINS ? process.env.ALLOWEDORIGINS.split(',') : [];
console.log("Allowed origins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    console.log("Incoming Origin:", origin);            
    if (!origin || allowedOrigins.includes(origin)) {
      console.log("CORS allowed for:", origin);        
      callback(null, true);
    } else {
      console.log("CORS blocked for:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use((req, _res, next) => {
  if (req.headers.origin) console.log("Header Origin:", req.headers.origin);  // <— ADD
  next();
});

app.use(cors(corsOptions));

// Use the routes defined in routes.js
app.use("/", routes);

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});
