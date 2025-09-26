import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "../src/components/Navbar";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "M DESCARTABLES - Productos Descartables de Calidad",
  description: "Productos descartables de la más alta calidad para tu hogar y negocio. Envíos rápidos y precios competitivos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={montserrat.variable}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
