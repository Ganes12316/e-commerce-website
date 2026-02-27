import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      console.log("protectRoute: No access token provided");
      return res.status(401).json({ message: "Unauthorized - No access token provided" });
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("protectRoute: User not found for ID:", decoded.userId);
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    console.log("protectRoute: User authenticated:", user._id);
    next();
  } catch (error) {
    console.log("protectRoute: Invalid token error:", error.message);
    return res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    console.log("adminRoute: Access denied for user:", req.user?.role || "unknown");
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};