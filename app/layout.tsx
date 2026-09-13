import "./globals.css";

export const metadata = {
  title: "DOYUNGO HOST",
  description: "DOYUNGO Web Hosting"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}