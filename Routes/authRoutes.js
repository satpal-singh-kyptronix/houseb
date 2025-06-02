const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../Middlewares/authMiddleware');

authRouter.post('/signup', authController.signup);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);

authRouter.get('/get-users-details',verifyToken, authController.getUserDetails);


authRouter.put('/user-profile',verifyToken, authController.upload.single('profileImage'), authController.updateUserDetails);
module.exports = authRouter