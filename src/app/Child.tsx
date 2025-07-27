"use client";

import { useEffect, useState, Suspense, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { useNetworkState } from "react-use";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

import Header from "@/components/layout/header/Header";
import { setOnlineStatus } from "@/slice/networkSlice";
import { useGetUserProfileQuery } from "@/hooks/UseAuth";
import { setUserProfile } from "@/slice/authSlice";

interface ChildProps {
  children: ReactNode;
}

const NO_HEADER_ROUTES = ["/auth", "/messages", "/workspaces"];
const NO_CONTAINER_ROUTES = ["/auth", "/messages"];

export default function Child({ children }: ChildProps) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { online } = useNetworkState();

  const showHeader = !NO_HEADER_ROUTES.some(route =>
    pathname?.startsWith(route)
  );

  const containerize = !NO_CONTAINER_ROUTES.some(route =>
    pathname?.startsWith(route)
  );

  const isMessagesRoute =
    pathname === "/messages" || pathname?.startsWith("/messages/");

  const {
    data: user,
  } = useGetUserProfileQuery({ refetchOnMountOrArgChange: true });

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
      toast.error("No Internet Connection", {
        description: "You are currently offline",
      });
    } else {
      toast.success("Back Online", {
        description: "You're reconnected!",
        action: {
          label: (
            <>
              <RefreshCcw className="w-4 pl-1" />
              <span className="px-1">Refresh</span>
            </>
          ),
          onClick: () => window.location.reload(),
        },
        duration: 5000,
      });
    }
  }, [online, dispatch]);

  useEffect(() => {
    if (user?.data) dispatch(setUserProfile(user.data));
  }, [dispatch, user?.data]);

  return (
    <>
      {showHeader && <Header />}
      <Suspense
        fallback={
          <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center space-y-8">
              <div className="animate-ping rounded-full h-10 w-10 bg-primary" />
              <pre className="text-lg font-semibold">Loading...</pre>
            </div>
          </div>
        }
      >

        <main className={`w-full min-h-[40vh] ${!isMessagesRoute ? "pt-3" : ""}`}>
          <div className={`mx-auto ${containerize ? "min-[1440px]:w-[1440px]" : ""}`}>
            {children}
          </div>
        </main>
      </Suspense>
    </>
  );
}
