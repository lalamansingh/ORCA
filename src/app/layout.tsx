import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import "./mobile/mobile.css";

export const metadata: Metadata = {
  title: "ORCA — Marine Intelligence",
  description: "Marine EcOsystem Reasoning with Collaborative Agents. Evidence-backed marine decision support.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
