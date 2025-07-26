import { Poppins } from "next/font/google";
// import { Urbanist } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";
import { Toaster } from "@/components/ui/sonner";
import Child from "./Child";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

// const inter = Inter({ subsets: ["latin"] });
// const urbanist = Urbanist({ subsets: ["latin"] });

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Onplo Chat App",
  description: "",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <title>Next JS Official</title>
        <meta name="theme-color" content="#DB7807" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#DB7807" />
        {/* <link rel="icon" type="image/svg+xml" href="/icon.svg" /> */}
      </head>
      <body
        className={`${poppins.className} w-screen min-h-screen`}
        suppressHydrationWarning
      >
        <TooltipProvider>
          <Provider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <Child>{children}</Child>
            </ThemeProvider>
            <Toaster
              expand={false}
              position="bottom-right"
              richColors
              closeButton
            />
          </Provider>
        </TooltipProvider>
      </body>
    </html>
  );
}
