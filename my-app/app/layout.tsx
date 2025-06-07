import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { RequestCallbackButton } from "@/components/request-callback-button";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Call Center Dashboard",
  description: "Manage your AI-powered call center operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          {children}
                </div>
              </main>
            </div>
            <RequestCallbackButton />
            <Toaster richColors position="top-right" />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
