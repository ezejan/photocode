import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PhotoCode",
  description: "OCR + SKU matching",
  // No declarar icons para evitar referencias a binarios en este PR.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Mantener manifest, quitar favicons/imagenes */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body className="min-h-dvh bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
