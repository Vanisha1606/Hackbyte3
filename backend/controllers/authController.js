const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const { generateToken } = require("../config/jwt");
const { verifyEmailDNS } = require("../utils/emailVerifyer");

const sanitizeUser = (u) => ({
  _id: u._id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  phone: u.phone,
  gender: u.gender,
  isAdmin: u.isAdmin,
});

const register = async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  if (!email || !password || !phone) {
    return res
      .status(400)
      .json({ message: "Email, password and phone are required" });
  }

  try {
    const isValidEmail = await verifyEmailDNS(email).catch(() => true);
    if (!isValidEmail) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const existingUser = await userModel.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email or phone" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
    });

    await newUser.save();
    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      token,
      userId: newUser._id,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login };
