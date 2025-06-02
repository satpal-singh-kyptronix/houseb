const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("DB Connected");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = { connectDB };
