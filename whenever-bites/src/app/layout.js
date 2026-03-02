import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "Whenever Bites",
  description: "Sistema de comidas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${dmSans.className} bg-background-primary text-text-primary antialiased`}
      >
        <div className="container max-w-screen-xl py-12">{children}</div>
      </body>
    </html>
  );
}
