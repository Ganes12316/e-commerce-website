import Product from "../models/product.model.js";
import mongoose from 'mongoose';


export const getCartProducts = async (req, res, next) => {
  try {
    console.log("=== getCartProducts START ===");
    
    if (!req.user || typeof req.user !== 'object') {
      console.log("ERROR: User not authenticated");
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    if (!Array.isArray(req.user.cartItems)) {
      console.log("WARNING: cartItems not array, initializing...");
      req.user.cartItems = [];
    }
    
    console.log("Cart items before filtering:", req.user.cartItems);
    
    const validCartItems = req.user.cartItems.filter(
      (item) => item && item.product && mongoose.Types.ObjectId.isValid(item.product)
    );
    
    const productIds = validCartItems.map((item) => item.product);
    
    console.log("Valid product IDs:", productIds);
    
    if (productIds.length === 0) {
      console.log("Cart is empty or has no valid products");
      return res.json([]);
    }
    
    const products = await Product.find({ _id: { $in: productIds } });
    console.log(`Found ${products.length} products`);

    const cartItems = products.map((product) => {
      const cartItem = validCartItems.find(
        (item) => item.product.toString() === product._id.toString()
      );
      
      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        isFeatured: product.isFeatured,
        quantity: cartItem?.quantity || 1,
      };
    });

    console.log("Returning cart items:", cartItems);
    console.log("=== getCartProducts SUCCESS ===");
    res.json(cartItems);
  } catch (error) {
    console.log("=== getCartProducts ERROR ===");
    console.log("Error message:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const addToCart = async (req, res, next) => {
  try {
    console.log("=== addToCart START ===");
    
    if (!req.user || typeof req.user !== 'object') {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    if (!Array.isArray(req.user.cartItems)) {
      req.user.cartItems = [];
    }
    
    const { productId } = req.body;
    
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid product ID required" });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingItem = req.user.cartItems.find(
      (item) => item.product && item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      req.user.cartItems.push({ product: productId, quantity: 1 });
    }

    await req.user.save();
    console.log("=== addToCart SUCCESS ===");
    
    res.json({ message: "Product added to cart", cartItems: req.user.cartItems });
  } catch (error) {
    console.log("=== addToCart ERROR ===", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const removeAllFromCart = async (req, res, next) => {
  try {
    console.log("=== removeAllFromCart START ===");
    
    if (!req.user || typeof req.user !== 'object') {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    if (!Array.isArray(req.user.cartItems)) {
      req.user.cartItems = [];
    }
    
    const { productId } = req.body;
    
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid product ID required" });
    }

    const cartItemsArray = req.user.cartItems.toObject ? req.user.cartItems.toObject() : [...req.user.cartItems];
    
    req.user.cartItems = cartItemsArray.filter((item) => {
      if (!item || !item.product) return false;
      return item.product.toString() !== productId;
    });
    
    await req.user.save();
    console.log("=== removeAllFromCart SUCCESS ===");
    
    res.json({ message: "Product removed from cart", cartItems: req.user.cartItems });
  } catch (error) {
    console.log("=== removeAllFromCart ERROR ===", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ NEW: Clear entire cart after successful payment
export const clearCart = async (req, res, next) => {
  try {
    console.log("=== clearCart START ===");
    
    if (!req.user || typeof req.user !== 'object') {
      return res.status(401).json({ message: "User not authenticated" });
    }

    req.user.cartItems = [];
    await req.user.save();

    console.log("=== clearCart SUCCESS ===");
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.log("=== clearCart ERROR ===", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateQuantity = async (req, res, next) => {
  try {
    console.log("=== updateQuantity START ===");
    
    if (!req.user || typeof req.user !== 'object') {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    if (!Array.isArray(req.user.cartItems)) {
      req.user.cartItems = [];
    }
    
    const { id: productId } = req.params;
    const { quantity } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid product ID required" });
    }

    if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ message: "Quantity must be a non-negative integer" });
    }

    const validCartItems = req.user.cartItems.filter(
      (item) => item && item.product && mongoose.Types.ObjectId.isValid(item.product)
    );

    const item = validCartItems.find((i) => i.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (quantity <= 0) {
      req.user.cartItems = req.user.cartItems.filter(
        (i) => i.product && i.product.toString() !== productId
      );
    } else {
      item.quantity = quantity;
    }

    await req.user.save();
    console.log("=== updateQuantity SUCCESS ===");
    
    res.json({ message: "Cart updated", cartItems: req.user.cartItems });
  } catch (error) {
    console.log("=== updateQuantity ERROR ===", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};