export const metadata = {
  title: "QR Ordering Starter",
  description: "Starter kit for QR code ordering + kitchen screen"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body style={{ margin: 0, background: "#fafafa" }}>{children}</body>
    </html>
  );
}
