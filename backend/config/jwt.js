const jwt = require("jsonwebtoken");
const config = require("./env");

const generateToken = (user) => {
  const payload = { id: user._id, email: user.email };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRATION,
  });
};

module.exports = { generateToken };
