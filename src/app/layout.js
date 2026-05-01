export const metadata = { title: "Archive Test" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#000', color: '#fff', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}