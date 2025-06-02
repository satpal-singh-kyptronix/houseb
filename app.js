// const express = require("express");
// const app = express();
// const dotenv = require("dotenv");
// dotenv.config();
// const bodyParser = require("body-parser");
// const path = require("path");
// const { connectDB } = require("./config/conn");
// const cors = require("cors");
// const authRouter = require("./Routes/authRoutes");
// const port = process.env.PORT || 5000;








// app.use(cors({
//   origin: ["http://localhost:5173","http://localhost:3000","http://localhost:3001","https://housebe.netlify.app/"], // Match frontend URL
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true,
// }));



// connectDB();
// app.use(express.json());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// // app.use("/uploads", express.static("uploads")); // Serve uploaded files as static



// app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// // Routes
// app.use('/api/auth', authRouter);


// app.get("/", (req, res) => {
//   res.write("Hello World!");
//   res.end();
// });


// // app.use('/about/me',AboutDoctorRouter)

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// app.js

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

const { connectDB } = require("./config/conn");
const authRouter = require("./Routes/authRoutes");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to the database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // Log incoming requests

// Serve static files from 'Uploads' directory
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// CORS setup
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://housebe.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// Routes
app.use('/api/auth', authRouter);

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


