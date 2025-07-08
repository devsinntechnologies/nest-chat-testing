"use client";

import Header from "@/components/layout/header/Header";
import { Suspense, ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useNetworkState } from "react-use";
import { useDispatch } from "react-redux";
import { setOnlineStatus } from "@/slice/networkSlice";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

interface ChildProps {
  children: ReactNode;
}

export default function Child({ children }: ChildProps) {
  const pathname = usePathname();
  const { online } = useNetworkState();
  const dispatch = useDispatch();
  const [userMode, setUserMode] = useState<string | null>(null);

//  useEffect(() => {
//   const socket = getSocket();
//   if (!socket) return;

//   const handleWelcome = (data: { message: string }) => {
//     toast.success(data.message);
//   };

//   socket.on('welcome', handleWelcome);

//   return () => {
//     socket.off('welcome', handleWelcome);
//   };
// }, [getSocket]);

  useEffect(() => {
    if (
      pathname &&
      !pathname.startsWith("/auth") &&
      !pathname.startsWith("/images/") &&
      !pathname.startsWith("/icons/")
    ) {
      localStorage.setItem("lastVisitedPath", pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const isOnline = !!online;
    dispatch(setOnlineStatus(isOnline));

    if (!isOnline) {
      toast.error('No Internet Connection', {
        description: 'You are currently offline',
      });
    } else {
      toast.success('Back Online', {
        description: "You're reconnected!",
        action: {
          label: <>
            <RefreshCcw className="w-4 pl-1" />
            <span className="px-1">Refresh</span>
          </>,
          onClick: () => window.location.reload(),
        },
        duration: 5000,
      });
    }
  }, [online, dispatch]);

  const noHeaderRoutes = ["/auth", "/seller", "/messages"];
  const noContainerize = ["/auth", "/messages"];

  const showHeader = !noHeaderRoutes.some((route) =>
    pathname?.startsWith(route)
  );
  const containerize = !noContainerize.some((route) =>
    pathname?.startsWith(route)
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserMode = localStorage.getItem("USER");
      setUserMode(storedUserMode);
    }
  }, []);

  // Check if the current path is messages or any messages sub-route
  const isMessagesRoute = pathname === '/messages' || pathname?.startsWith('/messages/');

  return (
    <>
      {showHeader && <Header />}
      <Suspense
        fallback={
          <>
            <>Loading....</>
            <span className="hidden">
              {userMode === "seller" && <p>Seller Mode Activated</p>}
            </span>
          </>
        }
      >
        <main className={`w-full min-h-[40vh] ${!isMessagesRoute ? 'pt-3' : ''}`}>
          <div className={`mx-auto ${containerize && "min-[1440px]:w-[1440px]"}`}>
            {children}
          </div>
        </main>
      </Suspense>
    </>
  );
}
