import '@ant-design/v5-patch-for-react-19';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdThemeProvider from "@/components/antd-theme-provider";
import { ApolloWrapper } from "@/lib/apollo/ApolloWrapper";
import "antd/dist/reset.css";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Knight Devs - Find Your Next Dream Job",
  description: "Connect with top companies and discover opportunities across multiple job platforms. Our intelligent scraping technology brings you the best jobs from LinkedIn, Indeed, Glassdoor, and more.",
};

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AntdRegistry>
            <AntdThemeProvider>
              <ApolloWrapper>
                {children}
              </ApolloWrapper>
            </AntdThemeProvider>
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
