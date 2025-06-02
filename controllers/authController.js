const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const signup = async (req, res) => {
  try {
    const { name, phone, email, country, password, businessName, location, userType } = req.body;

    // Validate userType
    const validUserTypes = ["Home owner", "Realtor", "Lenders"];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        status: "false",
        message: "Invalid user type",
        desc: "User type must be one of: Home owner, Realtor, Lenders",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "false",
        message: "Email already exists",
        desc: "Please use a different email address",
      });
    }

    // Create new user
    const user = new User({ name, phone, email, country, password, businessName, location, userType });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name, location, userType },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    // Send response with userType
    res.status(201).json({
      status: "true",
      message: "User created successfully",
      desc: "Your account has been created",
      token,
      userType,
    });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: "Server error",
      desc: error.message,
    });
  }
};

const login = async (req, res) => {
    try {
        const { email, password, userType } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (!(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (user.userType !== userType) {
            return res.status(401).json({ message: 'Invalid user type' });
        }
        const token = jwt.sign({ id: user._id, userType: user.userType }, process.env.SECRET_KEY, { expiresIn: '1d' });
        res.cookie('admintoken', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({status:true, message: 'Login successful', token, userType: user.userType,desc:"Login" });
    } catch (error) {
        res.status(500).json({ status:false,message: 'Server error', error: error.message });
    }
};

const logout = (req, res) => {
    res.clearCookie('admintoken');
    res.json({ message: 'Logout successful' });
};

const getUserDetails = async (req, res) => {
   try {
     const id=req.user;
     console.log("User ID:", id);
    if (!id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const user= await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({status:true,data:user,message: 'User details retrieved successfully' });
   } catch (error) {
    res.status(500).json({ status:false,message: 'Server error', error: error.message });
   }
}


const uploadDir = path.join(__dirname, '..', 'Uploads', 'adminprofile');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}_${file.originalname}`);
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and GIF images are allowed'), false);
    }
};

// Multer upload instance
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Update user details API with image upload
const updateUserDetails = async (req, res) => {
    try {
        const id = req.user;
        if (!id) {
            return res.status(401).json({ status: false, message: "Unauthorized" });
        }

        const { name, phone, email, location, businessName, password } = req.body;

        // Validate input
        if (!password) {
            return res.status(400).json({
                status: false,
                message: "Password is required for all updates",
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                status: false,
                message: "Password must be at least 6 characters long",
            });
        }

        // Check if at least one non-password field or file is provided
        if (!name && !phone && !email && !location && !businessName && !req.file) {
            return res.status(400).json({
                status: false,
                message: "At least one field (name, phone, email, location, businessName, or profile image) is required",
            });
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        // Prepare updates
        const updates = {};
        if (name) {
            if (name.trim().length < 2) {
                return res.status(400).json({
                    status: false,
                    message: "Name must be at least 2 characters long",
                });
            }
            updates.name = name.trim();
        }
        if (phone) {
            if (!/^\d{10}$/.test(phone)) {
                return res.status(400).json({
                    status: false,
                    message: "Phone number must be exactly 10 digits",
                });
            }
            const existingUser = await User.findOne({ phone });
            if (existingUser && existingUser._id.toString() !== id) {
                return res.status(400).json({
                    status: false,
                    message: "Phone number is already registered",
                });
            }
            updates.phone = phone.trim();
        }
        if (email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid email format",
                });
            }
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== id) {
                return res.status(400).json({
                    status: false,
                    message: "Email is already registered",
                });
            }
            updates.email = email.trim();
        }
        if (location) {
            updates.location = location.trim();
        }
        if (businessName) {
            updates.businessName = businessName.trim();
        }
        if (req.file) {
            // Delete old image if it exists
            if (user.profileImage) {
                const oldImagePath = path.join(__dirname, '..', user.profileImage.startsWith('/') ? user.profileImage.slice(1) : user.profileImage);
                try {
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                        console.log(`Deleted old image: ${oldImagePath}`);
                    } else {
                        console.log(`Old image not found: ${oldImagePath}`);
                    }
                } catch (err) {
                    console.error(`Error deleting old image: ${err.message}`);
                }
            }
            updates.profileImage = `/Uploads/adminprofile/${req.file.filename}`;
        }
        updates.password = await bcrypt.hash(password, 10);

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        res.status(200).json({
            status: true,
            data: updatedUser,
            message: "User details updated successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message,
        });
    }
};


// New updateUserDetails

// const updateUserDetails = async (req, res) => {
//   try {
//     const id = req.user;
//     if (!id) {
//       return res.status(401).json({ status: false, message: "Unauthorized" });
//     }

//     const { name, phone, email, location, businessName, password } = req.body;

//     // Validate input
//     if (!password) {
//       return res.status(400).json({
//         status: false,
//         message: "Password is required for all updates",
//       });
//     }
//     if (password.length < 6) {
//       return res.status(400).json({
//         status: false,
//         message: "Password must be at least 6 characters long",
//       });
//     }

//     // Check if at least one non-password field is provided
//     if (!name && !phone && !email && !location && !businessName) {
//       return res.status(400).json({
//         status: false,
//         message: "At least one field (name, phone, email, location, or businessName) is required",
//       });
//     }

//     // Find user
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     // Prepare updates
//     const updates = {};
//     if (name) {
//       if (name.trim().length < 2) {
//         return res.status(400).json({
//           status: false,
//           message: "Name must be at least 2 characters long",
//         });
//       }
//       updates.name = name.trim();
//     }
//     if (phone) {
//       if (!/^\d{10}$/.test(phone)) {
//         return res.status(400).json({
//           status: false,
//           message: "Phone number must be exactly 10 digits",
//         });
//       }
//       const existingUser = await User.findOne({ phone });
//       if (existingUser && existingUser._id.toString() !== id) {
//         return res.status(400).json({
//           status: false,
//           message: "Phone number is already registered",
//         });
//       }
//       updates.phone = phone.trim();
//     }
//     if (email) {
//       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//         return res.status(400).json({
//           status: false,
//           message: "Invalid email format",
//         });
//       }
//       const existingUser = await User.findOne({ email });
//       if (existingUser && existingUser._id.toString() !== id) {
//         return res.status(400).json({
//           status: false,
//           message: "Email is already registered",
//         });
//       }
//       updates.email = email.trim();
//     }
//     if (location) {
//       updates.location = location.trim();
//     }
//     if (businessName) {
//       updates.businessName = businessName.trim();
//     }
//     updates.password = await bcrypt.hash(password, 10);

//     // Update user
//     const updatedUser = await User.findByIdAndUpdate(
//       id,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select("-password");

//     res.status(200).json({
//       status: true,
//       data: updatedUser,
//       message: "User details updated successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };


module.exports = { signup, login, logout,getUserDetails,updateUserDetails,upload };

