"use client";
import { LineItem, Product } from "@/types/woocommerce";
import { formatAttributes } from "@/utils/utils";
import React, { createContext, useContext, useEffect, useState } from "react";

interface CartItem extends LineItem {
  image?: string;
  attributes?: string;
}

// Create the context
interface ShoppingCartContextType {
  cartItems: CartItem[];
  addToCart: (product: CartItem | any) => void;
  removeFromCart: (productId: number, variationId: number) => void;
  clearCart: () => void;
}

const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(
  undefined
);

// Create a provider component
export const ShoppingCartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const initialCartItems: CartItem[] = JSON.parse(
      window.localStorage.getItem("cartItems") || "[]"
    );
    setCartItems(initialCartItems);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (product: any) => {
    const existingItemIndex = cartItems.findIndex(
      (item) =>
        item.product_id === product.id &&
        item.variation_id === product.variation_id
    );

    if (existingItemIndex !== -1) {
      console.warn("Item already exists in the cart. Ignoring duplicate.");
      return; // Ignore duplicate item
    }
    setCartItems((prevItems) => [
      ...prevItems,
      {
        product_id: product.id,
        variation_id: product.variation_id,
        quantity: 1,
        name: product?.name,
        attributes: formatAttributes(product?.attributes),
        image: product?.images[0]?.src,
        price: Math.round(product.price * 100),
      },
    ]);
  };

  const removeFromCart = (productId: number, variationId: number) => {
    console.log(cartItems);
    console.log(productId, variationId);
    setCartItems((prevItems) =>
      prevItems.filter((item) => {
        return !!item.variation_id
          ? item.variation_id !== variationId
          : item.product_id !== productId;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <ShoppingCartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
};

// Custom hook to access the shopping cart context
export const useShoppingCart = () => {
  const context = useContext(ShoppingCartContext);

  if (!context) {
    throw new Error(
      "useShoppingCart must be used within a ShoppingCartProvider"
    );
  }

  return context;
};
