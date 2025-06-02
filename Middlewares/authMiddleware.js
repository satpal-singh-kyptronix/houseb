const jwt = require("jsonwebtoken");
const BlacklistModel = require("../Models/blacklistToken");

const verifyToken = async (req, res, next) => {
  try {
    // Ensure the Authorization header exists
    if (!req.headers.authorization) {
      return res.status(401).json({
        status: false,
        message: "Access denied. No token provided.",
        desc: "Please login properly!",
      });
    }

    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Access denied. No token provided.",
        desc: "Please login properly!",
      });
    }

    const checkBlackListToken = await BlacklistModel.findOne({ token });
    if (checkBlackListToken) {
      return res.status(400).json({
        status: false,
        message: "Token Blacklisted",
        desc: "Please login properly!",
      });
    }

    // Verify the token
    const decoded = await jwt.verify(token, process.env.SECRET_KEY);
    console.log("Decoded Token:", decoded);
    if (!decoded) {
      return res.status(401).json({
        status: false,
        message: "Invalid or expired token.",
        desc: "Please login again.",
      });
    } else {
      req.user = decoded?.id;
      req.token = token;
      next();
    }
  } catch (error) {
    console.error("Error during token verification:", error.message);
    return res.status(500).json({
      status: false,
      message: "An internal error occurred.",
      desc: "Technical Issue! Please try again later",
    });
  }
};

module.exports = verifyToken;

