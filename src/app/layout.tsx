import { ShoppingCartProvider } from "./components/CartContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-inter font-light bg-[#fcfcfc]">
        <ShoppingCartProvider>{children}</ShoppingCartProvider>
      </body>
    </html>
  );
}
