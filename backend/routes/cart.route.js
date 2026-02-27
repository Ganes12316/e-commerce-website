import express from "express";
import { addToCart, getCartProducts, removeAllFromCart, updateQuantity, clearCart } from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addToCart);
router.delete("/", protectRoute, removeAllFromCart);
router.delete("/clear", protectRoute, clearCart); // ✅ NEW: clears entire cart after payment
router.put("/:id", protectRoute, updateQuantity);

export default router;