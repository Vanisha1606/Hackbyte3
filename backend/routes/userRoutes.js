const express = require("express");
const { getAllUsers, getUserById } = require("../controllers/userController");
const { jwtMiddleware } = require("../middleware/jwtMiddleware");

const router = express.Router();

router.get("/getAllUser", jwtMiddleware, getAllUsers);
router.get("/:id", jwtMiddleware, getUserById);

module.exports = router;
