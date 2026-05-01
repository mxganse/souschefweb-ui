import "./globals.css";

export const metadata = {
  title: "Culinary Archive",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}