"use client";

import { useEffect, useState } from "react";
import { useShoppingCart } from "./CartContext";
import Image from "next/image";
import { FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { Popover } from "@headlessui/react";

interface cartProps {
  token: string;
}

export default function Cart({ token }: cartProps) {
  const { cartItems, clearCart, removeFromCart } = useShoppingCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const createOrder = async (data: any) => {
    if (cartItems.length === 0) return;

    let res: Response = await fetch(
      `http://tonecarrier.local/wp-json/wc/v3/orders`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const json = await res.json();
    console.log(json);
    clearCart();
  };

  const data = {
    payment_method: "cash",
    payment_method_title: "Cash",
    set_paid: true,
    billing: {
      email: "seklerek@gmail.com",
    },
    line_items: [
      ...cartItems.map(({ product_id, variation_id, quantity }) => ({
        product_id,
        variation_id,
        quantity,
      })),
    ],
  };

  return (
    <>
      <Popover className="relative">
        <Popover.Button className="flex">
          <FaShoppingCart />
          <span>{cartItems.length}</span>
        </Popover.Button>

        <Popover.Panel className="absolute z-50 bg-white">
          {!!cartItems ? (
            <div className="w-[400px] rounded-md overflow-hidden flex flex-col">
              {cartItems.map((item) => (
                <div
                  key={`cart-item-${item.product_id}-${item.variation_id}}`}
                  className="flex gap-4 p-4 border-b border-neutral-200 last:border-none bg-white w-full"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name as string}
                      width={100}
                      height={100}
                      className="aspect-square w-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="aspect-square w-12 bg-neutral-300 rounded-lg" />
                  )}
                  <div>
                    <div className="flex flex-col">
                      <span className="font-semibold">{item?.name}</span>
                      <span className="text-xs opacity-60">
                        {item?.attributes}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-2">
                    <span className="text-sm">
                      £{((item.price as number) / 100).toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        removeFromCart(
                          item.product_id,
                          item.variation_id as number
                        );
                      }}
                    >
                      <FaTrashAlt className="text-neutral-400 text-sm" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="p-6 bg-red-500 inline-block"
                onClick={() => {
                  createOrder(data);
                }}
              >
                Place order
              </button>
              <button
                className="p-6 bg-green-500 inline-block"
                onClick={() => {
                  clearCart();
                }}
              >
                Clear cart
              </button>
            </div>
          ) : (
            "cart empty bro"
          )}
        </Popover.Panel>
      </Popover>
    </>
  );
}
