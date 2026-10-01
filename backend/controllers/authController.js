const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      departmentId: user.departmentId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      departmentId,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message:
          "Name, email, password and role are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const allowedRegistrationRoles = [
      "Finance Officer",
      "Department Head",
    ];

    if (!allowedRegistrationRoles.includes(role)) {
      return res.status(400).json({
        message:
          "Only Finance Officer and Department Head accounts can be registered.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User with this email already exists.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      departmentId: departmentId || null,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      },
      token: generateToken(user),
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      },
      token: generateToken(user),
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};