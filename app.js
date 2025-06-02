const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require("body-parser");
const path = require("path");
const { connectDB } = require("./config/conn");
const cors = require("cors");
const authRouter = require("./Routes/authRoutes");
const port = process.env.PORT || 5000;








app.use(cors({
  origin: ["http://localhost:5173","http://localhost:3000","http://localhost:3001"], // Match frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));



connectDB();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use("/uploads", express.static("uploads")); // Serve uploaded files as static



app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Routes
app.use('/api/auth', authRouter);


app.get("/", (req, res) => {
  res.write("Hello World!");
  res.end();
});


// app.use('/about/me',AboutDoctorRouter)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


