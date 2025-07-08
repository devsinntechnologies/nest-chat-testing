import Image from "next/image";
import Link from "next/link";
import React from "react";
import Auth from "./Auth";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Boxes, MessageSquare } from "lucide-react";
import { useMediaQuery } from "@/hooks/UseMediaQuery";

const Header = () => {
  const isLoggedIn = useSelector(
    (state: RootState) => state.authSlice.isLoggedIn
  );
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // const noContainerize = ["/auth", "/messages"];

  // const containerize = !noContainerize.some((route) =>
  //   pathname?.startsWith(route)
  // );

  return (
    <header className="w-full" suppressHydrationWarning>
      {/* main header */}
      <nav className="w-full flex items-center justify-between px-5 py-2 sm:px-6 sm:py-3 md:px-10 md:py-4 lg:px-15 lg:py-5 gap-5 lg:gap-1">
        <div className="w-fit xl:w-25 2xl:w-26 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Next JS-official"
              width={100}
              height={40}
              className="w-26 min-[490px]:w-30 lg:w-[98px]"
            />
          </Link>
        </div>
        {/* authlink */}
        <div
          className={`flex items-center justify-center gap-2 sm:gap-2.5 xl:gap-3 `}
          suppressHydrationWarning
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 xl:gap-4">
            {[
              {
                href: "/messages",
                icon: <MessageSquare className="size-5" />,
                label: "Messages",
              },
              {
                href: "/workspaces",
                icon: <Boxes className="size-5" />,
                label: "Workspaces",
              },
            ].map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                      ? "bg-primary text-white shadow"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-primary"
                    }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="hidden lg:block">
            <Auth />
          </div>
          <div className="block lg:hidden">{isLoggedIn && <Auth />}</div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
