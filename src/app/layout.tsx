import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Physics and Circuits Laboratory Management System",
  description: "Laboratory management application — development scaffold.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
