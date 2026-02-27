import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),

  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/products", productData, { withCredentials: true });
      set((prev) => ({ products: [...prev.products, res.data] }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create product");
    } finally {
      set({ loading: false });
    }
  },

  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/products");
      set({ products: res.data.products || res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products");
    } finally {
      set({ loading: false });
    }
  },

  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const normalizedCategory = category.replace(/^\/+/, "");
      const res = await axios.get(`/products/category/${normalizedCategory}`);
      set({ products: res.data.products || res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products by category");
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`, { withCredentials: true });
      set((prev) => ({
        products: prev.products.filter((product) => product._id !== productId),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      set({ loading: false });
    }
  },

  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const res = await axios.patch(`/products/${productId}`, {}, { withCredentials: true });
      set((prev) => ({
        products: prev.products.map((product) =>
          product._id === productId ? res.data : product
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update product");
    } finally {
      set({ loading: false });
    }
  },

  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/products/featured", { withCredentials: true });

      const featuredProducts = (res.data.products || res.data).map((p) => ({
        ...p,
        imageUrl: p.image || p.imageUrl || "/fallback.jpg",
      }));

      set({ products: featuredProducts });
    } catch (error) {
      toast.error("Failed to fetch featured products");
      console.error(error.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },
}));
