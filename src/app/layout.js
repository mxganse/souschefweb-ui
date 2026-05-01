import "./globals.css"; // This points to src/app/globals.css
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Private Culinary Archive",
  description: "Secure archive for procedures and techniques",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#050505] antialiased`}>
        {children}
      </body>
    </html>
  );
}